from django.db import transaction
from rest_framework import serializers

from accounts.models import DoctorProfile, EmployeeProfile, User
from ohc.models import Diagnosis, MedicalTest, OHCVisit, Prescription
from ohc.services import process_diagnosis_outcome


class OHCVisitSerializer(serializers.ModelSerializer):
    class Meta:
        model = OHCVisit
        fields = "__all__"
        read_only_fields = ("id", "uuid", "created_at", "updated_at")


class DiagnosisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Diagnosis
        fields = "__all__"
        read_only_fields = ("id", "uuid", "created_at", "updated_at")

    def validate(self, attrs):
        request = self.context["request"]
        if request.user.role in {request.user.Role.DOCTOR, request.user.Role.NURSE} and not attrs.get("diagnosed_by"):
            attrs["diagnosed_by"] = DoctorProfile.objects.get(user=request.user)
        return attrs


class PrescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = "__all__"
        read_only_fields = ("id", "uuid", "created_at", "updated_at")


class PrescriptionEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        exclude = ("visit", "diagnosis", "prescribed_by")


class MedicalTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalTest
        fields = "__all__"
        read_only_fields = ("id", "uuid", "created_at", "updated_at")


class DiagnosisWithPrescriptionsSerializer(serializers.Serializer):
    diagnosis = DiagnosisSerializer()
    prescriptions = PrescriptionEntrySerializer(many=True, required=False)

    @transaction.atomic
    def create(self, validated_data):
        diagnosis_data = validated_data["diagnosis"]
        prescriptions_data = validated_data.get("prescriptions", [])
        diagnosis = Diagnosis.objects.create(**diagnosis_data)

        for prescription_data in prescriptions_data:
            Prescription.objects.create(
                diagnosis=diagnosis,
                visit=diagnosis.visit,
                prescribed_by=diagnosis.diagnosed_by,
                **{
                    key: value
                    for key, value in prescription_data.items()
                    if key not in {"visit", "diagnosis", "prescribed_by"}
                },
            )
        referral = process_diagnosis_outcome(diagnosis)
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
                "uuid": str(instance._generated_referral.uuid),
                "referral_status": instance._generated_referral.referral_status,
                "priority": instance._generated_referral.priority,
            },
            "visit_status": instance.visit.visit_status,
            "follow_up_date": instance.visit.follow_up_date,
            "next_action": instance.visit.next_action,
        }


class OHCVisitCreateSerializer(OHCVisitSerializer):
    employee = serializers.CharField(max_length=50)
    employee_name = serializers.CharField(max_length=150, required=False, allow_blank=True, write_only=True)
    employee_department = serializers.CharField(max_length=120, required=False, allow_blank=True, write_only=True)
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
        
        # If department was left empty, fallback to Unassigned
        if not emp_dept:
            emp_dept = "Unassigned"

        if emp_code:
            try:
                emp_profile = EmployeeProfile.objects.get(employee_code=emp_code)
            except EmployeeProfile.DoesNotExist:
                # Use provided name or default to employee code
                first_name = emp_name if emp_name else emp_code

                user = User.objects.create(
                    username=emp_code,
                    first_name=first_name[:150], # Max length protection
                    email=f"{emp_code}@temp.local",
                    role=User.Role.EMPLOYEE,
                    is_verified=True
                )
                emp_profile = EmployeeProfile.objects.create(
                    user=user,
                    employee_code=emp_code,
                    department=emp_dept,
                    designation="Unassigned"
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

