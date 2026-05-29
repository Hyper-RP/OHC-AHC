from django.db import transaction
from rest_framework import serializers

from accounts.models import DoctorProfile, EmployeeProfile, User
from ahc.models import Hospital
from ohc.models import Diagnosis, MedicalTest, OHCVisit, Prescription, MedicineStock, MedicineDispense
from ohc.services import process_diagnosis_outcome


class EmployeeInfoSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeProfile
        fields = ['id', 'employee_code', 'department', 'designation', 'fitness_status', 'user']
        read_only_fields = ['id']

    def get_user(self, obj):
        return {
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
        }

class DoctorInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorProfile
        fields = ['id']
        read_only_fields = ['id']

class OHCVisitSerializer(serializers.ModelSerializer):
    employee = EmployeeInfoSerializer(read_only=True)
    consulted_doctor = DoctorInfoSerializer(read_only=True)
    prescriptions = serializers.SerializerMethodField()

    class Meta:
        model = OHCVisit
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")

    def get_prescriptions(self, obj):
        """Get all prescriptions for this visit through diagnoses"""
        from accounts.models import DoctorProfile
        prescriptions = Prescription.objects.filter(diagnosis__visit=obj).select_related('diagnosis', 'prescribed_by')
        return [
            {
                'id': p.id,
                'medicine_name': p.medicine_name,
                'dosage': p.dosage,
                'frequency': p.frequency,
                'duration_days': p.duration_days,
                'route': p.route,
                'instructions': p.instructions,
                'start_date': p.start_date,
                'end_date': p.end_date,
                'status': p.status,
                'prescribed_by': {
                    'id': p.prescribed_by.id,
                    'name': f"{p.prescribed_by.user.first_name} {p.prescribed_by.user.last_name}"
                } if p.prescribed_by else None,
            }
            for p in prescriptions
        ]

class DiagnosisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Diagnosis
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at", "diagnosed_by")

class PrescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")

class PrescriptionEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        exclude = ("visit", "diagnosis", "prescribed_by", "status")

class MedicalTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalTest
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")

class DiagnosisWithPrescriptionsSerializer(serializers.Serializer):
    visit = serializers.IntegerField()
    diagnosis_code = serializers.CharField(max_length=50, required=False, allow_blank=True)
    diagnosis_name = serializers.CharField(max_length=255)
    diagnosis_notes = serializers.CharField(required=False, allow_blank=True)
    severity = serializers.CharField(max_length=15)
    condition_status = serializers.CharField(max_length=15, required=False, default="ACTIVE")
    is_primary = serializers.BooleanField(default=True)
    is_referral_required = serializers.BooleanField(default=False)
    hospital = serializers.PrimaryKeyRelatedField(
        queryset=Hospital.objects.filter(hospital_status=Hospital.HospitalStatus.ACTIVE),
        required=False,
        allow_null=True,
    )
    fitness_decision = serializers.CharField(max_length=30)
    work_restrictions = serializers.CharField(required=False, allow_blank=True)
    advised_rest_days = serializers.IntegerField(default=0)
    follow_up_date = serializers.DateField(required=False, allow_null=True)
    prescriptions = PrescriptionEntrySerializer(many=True, required=False)

    def validate_visit(self, value):
        try:
            return OHCVisit.objects.get(id=value)
        except OHCVisit.DoesNotExist:
            raise serializers.ValidationError("Visit not found")

    def validate(self, attrs):
        request = self.context["request"]
        if request.user.role != request.user.Role.DOCTOR:
            attrs["fitness_decision"] = Diagnosis.FitnessDecision.FIT
            attrs["work_restrictions"] = ""
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        request = self.context["request"]
        prescriptions_data = validated_data.pop("prescriptions", [])
        selected_hospital = validated_data.pop("hospital", None)

        diagnosed_by = None
        if request.user.role in {request.user.Role.DOCTOR, request.user.Role.NURSE}:
            diagnosed_by = DoctorProfile.objects.get(user=request.user)

        diagnosis = Diagnosis.objects.create(diagnosed_by=diagnosed_by, **validated_data)

        for prescription_data in prescriptions_data:
            Prescription.objects.create(
                diagnosis=diagnosis,
                visit=diagnosis.visit,
                prescribed_by=diagnosis.diagnosed_by,
                status=Prescription.PrescriptionStatus.ACTIVE,
                **{
                    key: value
                    for key, value in prescription_data.items()
                    if key not in {"visit", "diagnosis", "prescribed_by", "status"}
                },
            )
        referral = process_diagnosis_outcome(diagnosis)
        if referral and selected_hospital:
            referral.hospital = selected_hospital
            referral.referral_status = referral.ReferralStatus.SENT
            referral.save(update_fields=["hospital", "referral_status", "updated_at"])
        diagnosis._generated_referral = referral
        return diagnosis

    def to_representation(self, instance):
        return {
            "diagnosis": DiagnosisSerializer(instance, context=self.context).data,
            "prescriptions": PrescriptionSerializer(
                instance.prescriptions.all(),
                many=True,
                context=self.context,
            ).data,
            "referral": getattr(instance, "_generated_referral", None)
            and {
                "id": instance._generated_referral.id,
                "referral_status": instance._generated_referral.referral_status,
                "priority": instance._generated_referral.priority,
            },
            "visit_status": instance.visit.visit_status,
            "follow_up_date": instance.visit.follow_up_date,
            "next_action": instance.visit.next_action,
        }

class OHCVisitCreateSerializer(OHCVisitSerializer):
    employee = serializers.CharField(max_length=50, required=False)
    employee_name = serializers.CharField(max_length=150, required=False, allow_blank=True, write_only=True)
    employee_department = serializers.CharField(max_length=120, required=False, allow_blank=True, write_only=True)
    employee_fitness_status = serializers.ChoiceField(
        choices=EmployeeProfile.FitnessStatus.choices,
        required=False,
        write_only=True,
    )
    patient_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    patient_age = serializers.IntegerField(required=False, allow_null=True)
    patient_gender = serializers.CharField(max_length=10, required=False, allow_blank=True)
    patient_contact = serializers.CharField(max_length=20, required=False, allow_blank=True)
    visit_time = serializers.TimeField(required=False, allow_null=True)
    chief_complaint = serializers.CharField(max_length=255, required=False, allow_blank=True)
    symptoms = serializers.CharField(required=False, allow_blank=True)
    consulted_doctor = serializers.PrimaryKeyRelatedField(
        queryset=DoctorProfile.objects.all(),
        required=False,
        allow_null=True
    )

    def validate(self, attrs):
        request = self.context["request"]

        emp_code = attrs.pop("employee", None)
        emp_name = attrs.pop("employee_name", "")
        emp_dept = attrs.pop("employee_department", "Unassigned")
        emp_fitness_status = attrs.pop("employee_fitness_status", None)

        if request.user.role != request.user.Role.DOCTOR:
            emp_fitness_status = None

        # If department was left empty, fallback to Unassigned
        if not emp_dept:
            emp_dept = "Unassigned"

        if emp_code:
            try:
                emp_profile = EmployeeProfile.objects.get(employee_code=emp_code)
                updated_fields = []
                if emp_dept and emp_dept != "Unassigned" and emp_profile.department != emp_dept:
                    emp_profile.department = emp_dept
                    updated_fields.append("department")
                if emp_fitness_status and emp_profile.fitness_status != emp_fitness_status:
                    emp_profile.fitness_status = emp_fitness_status
                    updated_fields.append("fitness_status")
                if updated_fields:
                    updated_fields.append("updated_at")
                    emp_profile.save(update_fields=updated_fields)
            except EmployeeProfile.DoesNotExist:
                first_name = emp_name if emp_name else emp_code
                user = User.objects.create(
                    username=emp_code,
                    first_name=first_name[:150],
                    email=f"{emp_code}@temp.local",
                    role=User.Role.EMPLOYEE,
                    is_verified=True
                )
                emp_profile = EmployeeProfile.objects.create(
                    user=user,
                    employee_code=emp_code,
                    department=emp_dept,
                    designation="Unassigned",
                    fitness_status=emp_fitness_status or EmployeeProfile.FitnessStatus.FIT,
                )
            attrs["employee"] = emp_profile

        if request.user.role in {request.user.Role.DOCTOR, request.user.Role.NURSE} and not attrs.get("consulted_doctor"):
            attrs["consulted_doctor"] = DoctorProfile.objects.get(user=request.user)

        return super().validate(attrs)

class FollowUpScheduleSerializer(serializers.Serializer):
    follow_up_date = serializers.DateField()
    next_action = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def save(self, **kwargs):
        visit = self.context["visit"]
        visit.follow_up_date = self.validated_data["follow_up_date"]
        visit.next_action = self.validated_data.get("next_action") or "FOLLOW_UP"
        visit.visit_type = OHCVisit.VisitType.FOLLOW_UP
        visit.save(update_fields=["follow_up_date", "next_action", "visit_type", "updated_at"])
        return visit

class CompleteOHCIntakeSerializer(serializers.Serializer):
    """Combined serializer for complete OHC intake with visit and diagnosis in one submission."""

    # Visit fields
    employee = serializers.IntegerField()
    consulted_doctor = serializers.IntegerField(required=False, allow_null=True)
    visit_type = serializers.CharField(max_length=30)
    visit_date = serializers.DateTimeField()
    triage_level = serializers.CharField(max_length=10)
    chief_complaint = serializers.CharField(max_length=255)
    symptoms = serializers.CharField()
    vitals = serializers.JSONField(required=False, default=dict)
    preliminary_notes = serializers.CharField(required=False, allow_blank=True)

    # Diagnosis fields
    diagnosis_name = serializers.CharField(max_length=255)
    diagnosis_code = serializers.CharField(max_length=50, required=False, allow_blank=True)
    diagnosis_notes = serializers.CharField()
    diagnosis_severity = serializers.CharField(max_length=15)
    diagnosis_condition_status = serializers.CharField(max_length=15)
    fitness_decision = serializers.CharField(max_length=30)
    follow_up_date = serializers.DateField(required=False, allow_null=True)
    advised_rest_days = serializers.IntegerField(default=0)
    work_restrictions = serializers.CharField(required=False, allow_blank=True)

    # Prescriptions
    prescriptions = PrescriptionEntrySerializer(many=True, required=False)

    @transaction.atomic
    def create(self, validated_data):
        request = self.context["request"]

        # Get employee profile
        employee_id = validated_data.get("employee")
        employee_profile = EmployeeProfile.objects.get(id=employee_id)

        # Get doctor profile (from logged-in user if not provided)
        if validated_data.get("consulted_doctor"):
            doctor_profile = DoctorProfile.objects.get(id=validated_data["consulted_doctor"])
        else:
            doctor_profile = DoctorProfile.objects.get(user=request.user)

        # Create OHC Visit
        visit = OHCVisit.objects.create(
            employee=employee_profile,
            consulted_doctor=doctor_profile,
            visit_type=validated_data["visit_type"],
            visit_date=validated_data["visit_date"],
            triage_level=validated_data["triage_level"],
            chief_complaint=validated_data["chief_complaint"],
            symptoms=validated_data["symptoms"],
            vitals=validated_data.get("vitals", {}),
            preliminary_notes=validated_data.get("preliminary_notes", ""),
            visit_status=OHCVisit.VisitStatus.IN_PROGRESS,
        )

        # Create Diagnosis
        diagnosis = Diagnosis.objects.create(
            visit=visit,
            diagnosed_by=doctor_profile,
            diagnosis_code=validated_data.get("diagnosis_code", ""),
            diagnosis_name=validated_data["diagnosis_name"],
            diagnosis_notes=validated_data["diagnosis_notes"],
            severity=validated_data["diagnosis_severity"],
            condition_status=validated_data["diagnosis_condition_status"],
            fitness_decision=validated_data["fitness_decision"],
            follow_up_date=validated_data.get("follow_up_date"),
            advised_rest_days=validated_data.get("advised_rest_days", 0),
            work_restrictions=validated_data.get("work_restrictions", ""),
            is_primary=True,
        )

        # Create Prescriptions
        prescriptions_data = validated_data.get("prescriptions", [])
        for prescription_data in prescriptions_data:
            Prescription.objects.create(
                visit=visit,
                diagnosis=diagnosis,
                prescribed_by=doctor_profile,
                medicine_name=prescription_data.get("medicine_name", ""),
                dosage=prescription_data.get("dosage", ""),
                frequency=prescription_data.get("frequency", ""),
                duration_days=prescription_data.get("duration_days", 0),
                route=prescription_data.get("route", ""),
                instructions=prescription_data.get("instructions", ""),
                start_date=prescription_data.get("start_date"),
                status=Prescription.PrescriptionStatus.ACTIVE,
            )

        # Process diagnosis outcome (handles fitness decision, referrals, notifications)
        referral = process_diagnosis_outcome(diagnosis)

        # Store referral for response
        diagnosis._visit_id = visit.id
        diagnosis._generated_referral = referral

        return diagnosis

    def to_representation(self, instance):
        return {
            "visit_id": instance._visit_id,
            "diagnosis_id": instance.id,
            "diagnosis_name": instance.diagnosis_name,
            "fitness_decision": instance.fitness_decision,
            "visit_status": instance.visit.visit_status,
            "follow_up_date": instance.visit.follow_up_date,
            "next_action": instance.visit.next_action,
            "referral_id": getattr(instance, "_generated_referral", None) and instance._generated_referral.id,
            "referral_status": getattr(instance, "_generated_referral", None) and instance._generated_referral.referral_status,
            "message": "OHC intake and diagnosis completed successfully",
        }


class MedicineStockSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicineStock
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")


class MedicineDispenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicineDispense
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")


class MedicineDispenseCreateSerializer(serializers.Serializer):
    medicine_id = serializers.IntegerField()
    visit_id = serializers.IntegerField()
    prescription_id = serializers.IntegerField(required=False, allow_null=True)
    quantity_dispensed = serializers.IntegerField(min_value=1)
    issue_date = serializers.DateField()
    remarks = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        medicine_id = attrs.get("medicine_id")
        try:
            medicine = MedicineStock.objects.get(id=medicine_id)
        except MedicineStock.DoesNotExist:
            raise serializers.ValidationError({"medicine_id": "Medicine not found"})

        quantity = attrs.get("quantity_dispensed", 0)
        if quantity > medicine.stock_quantity:
            raise serializers.ValidationError({
                "quantity_dispensed": f"Cannot dispense {quantity}. Available stock: {medicine.stock_quantity}"
            })

        return attrs


class VisitStatusLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicineDispense
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")


class PharmacistPrescriptionSerializer(serializers.ModelSerializer):
    """Serializer for pharmacist to see pending prescriptions with visit and medicine details."""
    class Meta:
        model = Prescription
        fields = [
            "id",
            "medicine_name",
            "dosage",
            "frequency",
            "duration_days",
            "route",
            "instructions",
            "start_date",
            "status",
        ]
        read_only_fields = ("id", "start_date", "created_at", "updated_at")

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Add visit details
        if instance.visit:
            diagnoses = list(
                instance.visit.diagnoses.all().values(
                    "diagnosis_name",
                    "severity",
                    "fitness_decision",
                    "work_restrictions",
                    "advised_rest_days",
                    "follow_up_date",
                    "diagnosis_notes",
                )
            )
            prescriptions = list(
                instance.visit.prescriptions.all().values(
                    "medicine_name",
                    "dosage",
                    "frequency",
                    "duration_days",
                    "route",
                    "instructions",
                    "start_date",
                    "status",
                )
            )
            visit_data = {
                "id": instance.visit.id,
                "employee": {
                    "id": instance.visit.employee.id,
                    "employee_code": instance.visit.employee.employee_code,
                    "department": instance.visit.employee.department,
                    "fitness_status": instance.visit.employee.fitness_status,
                    "user": {
                        "first_name": instance.visit.employee.user.first_name,
                        "last_name": instance.visit.employee.user.last_name,
                    },
                },
                "visit_date": instance.visit.visit_date.isoformat() if instance.visit.visit_date else None,
                "visit_time": instance.visit.visit_time.isoformat() if instance.visit.visit_time else None,
                "visit_type": instance.visit.visit_type,
                "triage_level": instance.visit.triage_level,
                "visit_status": instance.visit.visit_status,
                "vitals": instance.visit.vitals,
                "chief_complaint": instance.visit.chief_complaint,
                "symptoms": instance.visit.symptoms,
                "preliminary_notes": instance.visit.preliminary_notes,
                "follow_up_date": instance.visit.follow_up_date.isoformat() if instance.visit.follow_up_date else None,
                "next_action": instance.visit.next_action,
                "doctor_name": instance.visit.consulted_doctor.user.get_full_name() or instance.visit.consulted_doctor.user.username,
                "diagnoses": diagnoses,
                "prescriptions": prescriptions,
            }
            data["visit"] = visit_data

        # Check if prescription has been dispensed
        from ohc.models import MedicineDispense
        is_dispensed = MedicineDispense.objects.filter(
            prescription=instance,
            status=MedicineDispense.DispenseStatus.DISPENSED
        ).exists()
        data["is_dispensed"] = is_dispensed

        # Try to find matching medicine in inventory
        medicine_info = {}
        try:
            from ohc.models import MedicineStock
            # Try exact match first
            medicine = MedicineStock.objects.filter(
                name__icontains=instance.medicine_name
            ).first()
            if medicine:
                medicine_info = {
                    "id": medicine.id,
                    "name": medicine.name,
                    "medicine_id": medicine.medicine_id,
                    "stock_quantity": medicine.stock_quantity,
                    "unit": medicine.unit,
                    "reorder_level": medicine.reorder_level,
                    "is_low_stock": medicine.is_low_stock,
                    "is_expired": medicine.is_expired,
                    "is_expiring_soon": medicine.is_expiring_soon,
                    "supplier": medicine.supplier,
                    "batch_number": medicine.batch_number,
                    "expiry_date": medicine.expiry_date.isoformat() if medicine.expiry_date else None,
                }
        except Exception:
            pass
        data["medicine"] = medicine_info if medicine_info else None

        return data
