from rest_framework import mixins, permissions, status, viewsets, filters
from rest_framework.decorators import action
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as df_filters

from accounts.permissions import (
    HasHealthPortalAccess,
    IsClinicalOrComplianceStaff,
    IsClinicalStaff,
    IsPharmacist,
)
from ohc.models import MedicalTest, OHCVisit, MedicineStock, MedicineDispense
from ohc.serializers import (
    CompleteOHCIntakeSerializer,
    DiagnosisWithPrescriptionsSerializer,
    FollowUpScheduleSerializer,
    MedicalTestSerializer,
    OHCVisitCreateSerializer,
    OHCVisitSerializer,
)


def get_accessible_ohc_visits(user):
    """Return the OHC visits a user is allowed to view."""
    queryset = OHCVisit.objects.select_related(
        "employee",
        "employee__user",
        "consulted_doctor",
        "consulted_doctor__user",
    ).order_by("-created_at")

    if user.is_superuser or user.role in {
        user.Role.ADMIN,
        user.Role.MANAGEMENT,
        user.Role.HR,
        user.Role.EHS,
        user.Role.KAM,
    }:
        return queryset

    if user.role == user.Role.DOCTOR:
        doctor_profile = getattr(user, "doctor_profile", None)
        if doctor_profile:
            return queryset.filter(consulted_doctor=doctor_profile)

    if user.role == user.Role.NURSE:
        return queryset

    if user.role == user.Role.PHARMACIST:
        return queryset.filter(visit_status=OHCVisit.VisitStatus.IN_PROGRESS)

    if user.role == user.Role.EMPLOYEE:
        employee_profile = getattr(user, "employee_profile", None)
        if employee_profile:
            return queryset.filter(employee=employee_profile)

    return queryset.none()


class OHCVisitFilter(df_filters.FilterSet):
    """Custom filter for OHCVisit with date range support"""
    date_from = df_filters.DateFilter(field_name='visit_date', lookup_expr='gte')
    date_to = df_filters.DateFilter(field_name='visit_date', lookup_expr='lte')
    department = df_filters.CharFilter(field_name='employee__department', lookup_expr='icontains')

    # Map 'OPD' to 'WALK_IN' for filtering
    visit_type = df_filters.CharFilter(method='filter_visit_type')

    def filter_visit_type(self, queryset, name, value):
        """Map OPD to WALK_IN for filtering"""
        if value == 'OPD':
            return queryset.filter(visit_type='WALK_IN')
        return queryset.filter(visit_type=value)

    class Meta:
        model = OHCVisit
        fields = ['visit_status', 'visit_type', 'triage_level']


class OHCVisitViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = OHCVisitFilter
    search_fields = ['employee__user__first_name', 'employee__user__last_name', 'employee__employee_code']
    ordering_fields = ['visit_date', 'created_at', 'visit_time']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in {"create", "update", "destroy"}:
            return [permissions.IsAuthenticated(), HasHealthPortalAccess(), IsClinicalOrComplianceStaff()]
        if self.action == "partial_update":
            return [permissions.IsAuthenticated(), HasHealthPortalAccess()]
        return [permissions.IsAuthenticated(), HasHealthPortalAccess()]

    def get_queryset(self):
        return get_accessible_ohc_visits(self.request.user)

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return OHCVisitCreateSerializer
        return OHCVisitSerializer

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, HasHealthPortalAccess, IsClinicalOrComplianceStaff])
    def schedule_follow_up(self, request, id=None):
        visit = self.get_object()
        serializer = FollowUpScheduleSerializer(data=request.data, context={"visit": visit, "request": request})
        serializer.is_valid(raise_exception=True)
        visit = serializer.save()
        return Response(OHCVisitSerializer(visit, context={"request": request}).data, status=status.HTTP_200_OK)


class DiagnosisPrescriptionAPIView(GenericAPIView):
    serializer_class = DiagnosisWithPrescriptionsSerializer
    permission_classes = [permissions.IsAuthenticated, HasHealthPortalAccess, IsClinicalStaff]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        diagnosis = serializer.save()
        return Response(
            self.get_serializer(diagnosis, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class MedicalTestViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = MedicalTestSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update"}:
            return [permissions.IsAuthenticated(), HasHealthPortalAccess(), IsClinicalOrComplianceStaff()]
        return [permissions.IsAuthenticated(), HasHealthPortalAccess()]

    def get_queryset(self):
        queryset = MedicalTest.objects.select_related(
            "visit",
            "visit__employee",
            "requested_by",
            "requested_by__user",
        ).order_by("-created_at")
        user = self.request.user
        if user.is_superuser or user.role in {user.Role.ADMIN, user.Role.MANAGEMENT, user.Role.HR, user.Role.EHS, user.Role.KAM}:
            return queryset
        if user.role in {user.Role.DOCTOR, user.Role.NURSE}:
            doctor_profile = getattr(user, "doctor_profile", None)
            if doctor_profile:
                return queryset.filter(requested_by=doctor_profile)
        if user.role == user.Role.EMPLOYEE:
            employee_profile = getattr(user, "employee_profile", None)
            if employee_profile:
                return queryset.filter(visit__employee=employee_profile)
        return queryset.none()


class CompleteOHCIntakeAPIView(GenericAPIView):
    """Combined endpoint for OHC visit creation and diagnosis entry in one submission."""
    serializer_class = CompleteOHCIntakeSerializer
    permission_classes = [permissions.IsAuthenticated, HasHealthPortalAccess, IsClinicalOrComplianceStaff]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        diagnosis = serializer.save()
        return Response(
            self.get_serializer(diagnosis, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class MedicineStockViewSet(viewsets.ModelViewSet):
    """ViewSet for medicine inventory management."""
    from ohc.serializers import MedicineStockSerializer
    serializer_class = MedicineStockSerializer
    permission_classes = [permissions.IsAuthenticated, HasHealthPortalAccess]
    lookup_field = 'id'

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [permissions.IsAuthenticated(), HasHealthPortalAccess(), IsPharmacist()]
        return [permissions.IsAuthenticated(), HasHealthPortalAccess()]

    def get_queryset(self):
        queryset = MedicineStock.objects.all().order_by("name")
        return queryset

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, HasHealthPortalAccess, IsPharmacist])
    def dispense(self, request, id=None):
        """Dispense medicine and update stock."""
        from django.db import transaction

        medicine = self.get_object()
        data = request.data

        quantity = int(data.get("quantity_dispensed", 0))
        visit_id = data.get("visit_id")
        prescription_id = data.get("prescription_id")
        issue_date = data.get("issue_date")
        remarks = data.get("remarks", "")

        if quantity > medicine.stock_quantity:
            return Response(
                {"error": "Insufficient stock"},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            from django.db.models import F
            from django.utils import timezone

            quantity_before = medicine.stock_quantity
            quantity_remaining = quantity_before - quantity

            medicine.stock_quantity = F("stock_quantity") - quantity
            medicine.used_quantity = F("used_quantity") + quantity
            medicine.last_dispensed_at = timezone.now()
            medicine.save(update_fields=["stock_quantity", "used_quantity", "last_dispensed_at"])

            MedicineDispense.objects.create(
                medicine=medicine,
                visit_id=visit_id,
                prescription_id=prescription_id,
                dispensed_by=request.user,
                quantity_dispensed=quantity,
                quantity_remaining=quantity_remaining,
                issue_date=issue_date,
                remarks=remarks,
                status=MedicineDispense.DispenseStatus.DISPENSED,
            )

        return Response({
            "medicine_id": medicine.id,
            "medicine_name": medicine.name,
            "quantity_before": quantity_before,
            "quantity_dispensed": quantity,
            "quantity_remaining": quantity_remaining,
            "issue_date": issue_date,
            "remarks": remarks,
            "message": "Medicine dispensed successfully"
        }, status=status.HTTP_200_OK)


class AnalyticsViewSet(viewsets.GenericViewSet):
    """ViewSet for EHS and Management analytics."""
    permission_classes = [permissions.IsAuthenticated, HasHealthPortalAccess]

    def list(self, request, *args, **kwargs):
        """Get dashboard analytics data."""
        from django.db.models import Count, Sum, Q
        from django.utils import timezone
        from datetime import timedelta

        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        department = request.query_params.get("department")
        severity = request.query_params.get("severity")
        status_filter = request.query_params.get("status")

        visits = get_accessible_ohc_visits(request.user)

        if date_from:
            visits = visits.filter(visit_date__gte=date_from)
        if date_to:
            visits = visits.filter(visit_date__lte=date_to)
        if department:
            visits = visits.filter(employee__department__icontains=department)
        if status_filter:
            visits = visits.filter(visit_status=status_filter)

        total_visits = visits.count()

        open_cases = visits.filter(visit_status=OHCVisit.VisitStatus.OPEN).count()
        completed_cases = visits.filter(visit_status=OHCVisit.VisitStatus.COMPLETED).count()

        follow_up_pending = visits.filter(
            follow_up_date__isnull=False,
            follow_up_date__lt=timezone.now().date()
        ).count()

        # Department-wise visits (clear order_by to enable proper aggregation)
        department_wise = list(visits.order_by().values("employee__department").annotate(
            visit_count=Count("id")
        ))

        # Severity-wise cases
        severity_wise = {
            "LOW": visits.filter(triage_level=OHCVisit.TriageLevel.LOW).count(),
            "MEDIUM": visits.filter(triage_level=OHCVisit.TriageLevel.MEDIUM).count(),
            "HIGH": visits.filter(triage_level=OHCVisit.TriageLevel.HIGH).count(),
            "CRITICAL": visits.filter(triage_level=OHCVisit.TriageLevel.CRITICAL).count(),
        }

        # Common diagnoses
        from ohc.models import Diagnosis
        diagnoses = Diagnosis.objects.filter(visit__in=visits)
        common_diagnoses = list(diagnoses.order_by().values("diagnosis_name").annotate(
            count=Count("id")
        ).order_by("-count")[:5])

        # Critical cases
        critical_cases = list(
            visits.filter(triage_level=OHCVisit.TriageLevel.CRITICAL).values(
                "id",
                "employee__user__first_name",
                "employee__user__last_name",
                "employee__employee_code",
                "visit_date",
                "triage_level",
                "chief_complaint"
            )[:10]
        )

        # Pending follow-ups
        pending_follow_ups = list(
            visits.filter(
                follow_up_date__isnull=False,
                follow_up_date__lt=timezone.now().date()
            ).values(
                "id",
                "employee__user__first_name",
                "employee__user__last_name",
                "employee__employee_code",
                "follow_up_date"
            )
        )

        return Response({
            "summary": {
                "total_visits": total_visits,
                "open_cases": open_cases,
                "completed_cases": completed_cases,
                "follow_up_pending": follow_up_pending,
            },
            "department_wise": [
                {
                    "department": item["employee__department"],
                    "visit_count": item["visit_count"],
                    "percentage": round((item["visit_count"] / total_visits * 100), 1) if total_visits > 0 else 0
                } for item in department_wise
            ],
            "severity_wise": severity_wise,
            "common_diagnoses": [
                {
                    "diagnosis_name": item["diagnosis_name"],
                    "count": item["count"],
                    "percentage": round((item["count"] / total_visits * 100), 1) if total_visits > 0 else 0
                } for item in common_diagnoses
            ],
            "critical_cases": [
                {
                    "id": item["id"],
                    "patient_name": f"{item['employee__user__first_name']} {item['employee__user__last_name']}",
                    "employee_code": item["employee__employee_code"],
                    "visit_date": item["visit_date"].isoformat(),
                    "triage_level": item["triage_level"],
                    "chief_complaint": item["chief_complaint"]
                } for item in critical_cases
            ],
            "pending_follow_ups": [
                {
                    "id": item["id"],
                    "patient_name": f"{item['employee__user__first_name']} {item['employee__user__last_name']}",
                    "employee_code": item["employee__employee_code"],
                    "follow_up_date": item["follow_up_date"].isoformat() if item["follow_up_date"] else None,
                    "days_overdue": (timezone.now().date() - item["follow_up_date"]).days if item["follow_up_date"] else 0
                } for item in pending_follow_ups
            ]
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path='ehs-statistics', permission_classes=[permissions.IsAuthenticated, HasHealthPortalAccess])
    def ehs_statistics(self, request, *args, **kwargs):
        """Get comprehensive EHS statistics including OPD, pre-employment, AHC, incidents, emergencies, and referrals."""
        from django.db.models import Count, Case, When, IntegerField, Q
        from django.utils import timezone
        from datetime import datetime
        from ohc.models import Diagnosis
        from accounts.models import EmployeeProfile
        from ahc.models import Referral

        today = timezone.now().date()
        current_year = today.year

        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        department = request.query_params.get("department")

        base_visits = get_accessible_ohc_visits(request.user)

        if date_from:
            base_visits = base_visits.filter(visit_date__gte=date_from)
        if date_to:
            base_visits = base_visits.filter(visit_date__lte=date_to)
        if department:
            base_visits = base_visits.filter(employee__department__icontains=department)

        # OPD Statistics (WALK_IN, FOLLOW_UP, PERIODIC - exclude PRE_EMPLOYMENT and EMERGENCY)
        opd_types = [
            OHCVisit.VisitType.WALK_IN,
            OHCVisit.VisitType.FOLLOW_UP,
            OHCVisit.VisitType.PERIODIC,
        ]
        opd_visits_today = (
            base_visits.filter(
                visit_date__date=today,
                visit_type__in=opd_types,
            )
            .select_related("employee__user")
            .order_by("-visit_time")[:50]
        )
        opd_today_count = opd_visits_today.count()
        opd_till_date = base_visits.filter(visit_type__in=opd_types).count()

        opd_visits_list = []
        for visit in opd_visits_today:
            visit_time = visit.visit_time.isoformat() if visit.visit_time else visit.visit_date.isoformat()
            opd_visits_list.append({
                "id": str(visit.id),
                "employee_code": visit.employee.employee_code,
                "employee_name": f"{visit.employee.user.first_name} {visit.employee.user.last_name}",
                "department": visit.employee.department or "N/A",
                "visit_time": visit_time,
                "chief_complaint": visit.chief_complaint or "",
                "status": visit.visit_status,
            })

        # Pre-Employment Statistics
        pre_employment_visits = base_visits.filter(visit_type=OHCVisit.VisitType.PRE_EMPLOYMENT)
        total_pre_employment = pre_employment_visits.count()
        today_pre_employment = pre_employment_visits.filter(visit_date__date=today).count()

        fitness_stats = Diagnosis.objects.filter(
            visit__visit_type=OHCVisit.VisitType.PRE_EMPLOYMENT,
            is_primary=True,
        ).aggregate(
            fit_count=Count(Case(
                When(fitness_decision__in=["FIT", "FIT_WITH_RESTRICTION"], then=1),
                output_field=IntegerField(),
            )),
            unfit_count=Count(Case(
                When(fitness_decision__in=["TEMPORARY_UNFIT", "UNFIT"], then=1),
                output_field=IntegerField(),
            ))
        )
        fit_count = fitness_stats["fit_count"] or 0
        unfit_count = fitness_stats["unfit_count"] or 0
        fit_rate = round((fit_count / total_pre_employment * 100), 2) if total_pre_employment > 0 else 0

        # AHC Statistics (Annual Health Checkup - PERIODIC visits grouped by employee and year)
        ahc_visits_today = base_visits.filter(
            visit_type=OHCVisit.VisitType.PERIODIC,
            visit_date__date=today,
        ).count()

        employees_with_ahc = (
            base_visits.filter(
                visit_type=OHCVisit.VisitType.PERIODIC,
                visit_date__year=current_year,
            )
            .values("employee_id")
            .distinct()
            .count()
        )
        total_employees = EmployeeProfile.objects.count()
        ahc_completion_percentage = round((employees_with_ahc / total_employees * 100), 2) if total_employees > 0 else 0

        # Incident Cases Statistics (work-related injuries, NOT medical emergencies)
        incident_keywords = [
            "injury", "accident", "cut", "burn", "fall", "machine",
            "equipment", "crush", "puncture", "fracture", "sprain",
            "strain", "work", "occupational"
        ]
        incident_q = Q()
        for keyword in incident_keywords:
            incident_q |= Q(chief_complaint__icontains=keyword)

        incident_visits = base_visits.filter(
            incident_q,
            ~Q(visit_type=OHCVisit.VisitType.EMERGENCY)
        )
        incident_today_count = incident_visits.filter(visit_date__date=today).count()
        incident_till_date_count = incident_visits.count()

        incident_severity = {
            "LOW": incident_visits.filter(triage_level=OHCVisit.TriageLevel.LOW).count(),
            "MEDIUM": incident_visits.filter(triage_level=OHCVisit.TriageLevel.MEDIUM).count(),
            "HIGH": incident_visits.filter(triage_level=OHCVisit.TriageLevel.HIGH).count(),
            "CRITICAL": incident_visits.filter(triage_level=OHCVisit.TriageLevel.CRITICAL).count(),
        }

        # Emergency Cases Statistics (medical emergencies)
        emergency_keywords = [
            "heart attack", "unconscious", "fainted", "seizure",
            "stroke", "breathing difficulty", "chest pain",
            "severe pain", "emergency", "collapse"
        ]
        emergency_q = Q()
        for keyword in emergency_keywords:
            emergency_q |= Q(chief_complaint__icontains=keyword)

        emergency_visits = base_visits.filter(
            Q(visit_type=OHCVisit.VisitType.EMERGENCY) | emergency_q
        )
        emergency_today_count = emergency_visits.filter(visit_date__date=today).count()
        emergency_till_date_count = emergency_visits.count()

        emergency_severity = {
            "LOW": emergency_visits.filter(triage_level=OHCVisit.TriageLevel.LOW).count(),
            "MEDIUM": emergency_visits.filter(triage_level=OHCVisit.TriageLevel.MEDIUM).count(),
            "HIGH": emergency_visits.filter(triage_level=OHCVisit.TriageLevel.HIGH).count(),
            "CRITICAL": emergency_visits.filter(triage_level=OHCVisit.TriageLevel.CRITICAL).count(),
        }

        # Referred Cases Statistics
        referred_from_status = base_visits.filter(
            visit_status=OHCVisit.VisitStatus.REFERRED
        ).order_by()
        referred_from_flag = base_visits.filter(requires_referral=True).order_by()
        referred_visits = referred_from_status.union(referred_from_flag)
        referred_till_date_count = referred_visits.count()

        today_referrals = Referral.objects.filter(created_at__date=today).count()
        today_referral_count = today_referrals

        hospital_stats = Referral.objects.values("hospital__name").annotate(
            referral_count=Count("id")
        ).filter(hospital__name__isnull=False).order_by("-referral_count")[:10]

        hospital_list = [
            {"hospital_name": item["hospital__name"], "referral_count": item["referral_count"]}
            for item in hospital_stats
        ]

        return Response(
            {
                "opd": {
                    "today_count": opd_today_count,
                    "till_date_count": opd_till_date,
                    "visits": opd_visits_list,
                },
                "preEmployment": {
                    "total_checks": total_pre_employment,
                    "fit_count": fit_count,
                    "unfit_count": unfit_count,
                    "fit_rate": fit_rate,
                    "today_count": today_pre_employment,
                },
                "ahc": {
                    "today_count": ahc_visits_today,
                    "till_date_count": employees_with_ahc,
                    "total_employees": total_employees,
                    "completion_percentage": ahc_completion_percentage,
                },
                "incident": {
                    "today_count": incident_today_count,
                    "till_date_count": incident_till_date_count,
                    "severity": incident_severity,
                    "attention_required": incident_today_count > 0,
                },
                "emergency": {
                    "today_count": emergency_today_count,
                    "till_date_count": emergency_till_date_count,
                    "severity": emergency_severity,
                    "critical_alert": emergency_today_count > 0,
                },
                "referred": {
                    "today_count": today_referral_count,
                    "till_date_count": referred_till_date_count,
                    "hospitals": hospital_list,
                },
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path="follow-up-details", permission_classes=[permissions.IsAuthenticated, HasHealthPortalAccess])
    def follow_up_details(self, request):
        """Get detailed information for a specific follow-up (visit)."""
        from django.utils import timezone
        from ohc.models import Diagnosis

        visit_id = request.query_params.get("id")
        if not visit_id:
            return Response(
                {"error": "Visit ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        accessible_visits = get_accessible_ohc_visits(request.user)

        try:
            visit = accessible_visits.select_related(
                "employee__user",
                "consulted_doctor__user",
            ).get(id=visit_id)
        except OHCVisit.DoesNotExist:
            return Response(
                {"error": "Follow-up not found or access denied"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get primary diagnosis for this visit
        primary_diagnosis = Diagnosis.objects.filter(
            visit=visit,
            is_primary=True
        ).first()

        # Calculate days overdue
        days_overdue = 0
        if visit.follow_up_date:
            days_overdue = (timezone.now().date() - visit.follow_up_date).days
            if days_overdue < 0:
                days_overdue = 0

        return Response({
            "id": visit.id,
            "patient_name": f"{visit.employee.user.first_name} {visit.employee.user.last_name}",
            "employee_code": visit.employee.employee_code,
            "department": visit.employee.department or "N/A",
            "employee_contact": visit.employee.user.email or visit.patient_contact or "N/A",
            "employee_phone": visit.patient_contact or "N/A",
            "original_visit_date": visit.visit_date.date().isoformat(),
            "follow_up_date": visit.follow_up_date.isoformat() if visit.follow_up_date else None,
            "days_overdue": days_overdue,
            "chief_complaint": visit.chief_complaint or "",
            "diagnosis": primary_diagnosis.diagnosis_name if primary_diagnosis else "No diagnosis recorded",
            "doctor_notes": visit.preliminary_notes or visit.symptoms or "No notes",
            "follow_up_instructions": visit.next_action or "No specific instructions",
            "visit_status": visit.visit_status,
            "triage_level": visit.triage_level,
            "consulted_doctor": f"{visit.consulted_doctor.user.first_name} {visit.consulted_doctor.user.last_name}" if visit.consulted_doctor else "N/A",
        }, status=status.HTTP_200_OK)


class MedicineSummaryViewSet(viewsets.GenericViewSet):
    """ViewSet for medicine usage summary (Management only)."""
    permission_classes = [permissions.IsAuthenticated, HasHealthPortalAccess]

    def list(self, request, *args, **kwargs):
        """Get medicine summary data."""
        from django.db.models import Sum, Count

        visits = get_accessible_ohc_visits(request.user)

        total_ohc_visits = visits.count()

        dispenses = MedicineDispense.objects.all()
        total_medicine_used = dispenses.aggregate(total=Sum("quantity_dispensed"))["total"] or 0

        medicine_stocks = MedicineStock.objects.all()
        stock_summary = {
            "total_items": medicine_stocks.count(),
            "low_stock_items": sum(1 for m in medicine_stocks if m.is_low_stock),
            "expiring_items": sum(1 for m in medicine_stocks if m.is_expiring_soon),
            "total_stock_value": 0,
        }

        return Response({
            "summary": {
                "total_ohc_visits": total_ohc_visits,
                "total_medicine_used": total_medicine_used,
                "total_medicine_value": total_medicine_used * 20,
                "stock_summary": stock_summary,
            },
            "department_health_trends": [],
            "monthly_reports": []
        }, status=status.HTTP_200_OK)


class PrescriptionListViewSet(viewsets.GenericViewSet):
    """ViewSet for pharmacist to view pending prescriptions ready for dispensing."""
    from ohc.serializers import PharmacistPrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated, HasHealthPortalAccess, IsPharmacist]
    serializer_class = PharmacistPrescriptionSerializer

    def list(self, request, *args, **kwargs):
        """List prescriptions that are pending for dispensing.
        Only prescriptions from visits with IN_PROGRESS status and ACTIVE prescriptions.
        """
        from ohc.models import OHCVisit, Prescription, MedicineDispense

        queryset = (
            Prescription.objects.select_related(
                "visit",
                "visit__employee",
                "visit__employee__user",
            )
            .filter(
                status=Prescription.PrescriptionStatus.ACTIVE,
                visit__visit_status=OHCVisit.VisitStatus.IN_PROGRESS,
            )
            .order_by("-visit__visit_date")
        )

        # Annotate with dispense status
        prescription_ids = queryset.values_list("id", flat=True)
        dispensed_prescription_ids = MedicineDispense.objects.filter(
            prescription__id__in=prescription_ids,
            status=MedicineDispense.DispenseStatus.DISPENSED,
        ).values_list("prescription_id", flat=True)

        # Serialize with dispense status
        serializer = self.get_serializer_class()
        return Response(serializer(queryset, many=True).data, status=status.HTTP_200_OK)
