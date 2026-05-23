from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response

from accounts.permissions import (
    HasHealthPortalAccess,
    IsClinicalOrComplianceStaff,
    IsClinicalStaff,
    IsPharmacist,
    IsEHSOrManagement,
    IsManagement,
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


class OHCVisitViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [permissions.IsAuthenticated(), HasHealthPortalAccess(), IsClinicalOrComplianceStaff()]
        return [permissions.IsAuthenticated(), HasHealthPortalAccess()]

    def get_queryset(self):
        queryset = OHCVisit.objects.select_related(
            "employee",
            "employee__user",
            "consulted_doctor",
            "consulted_doctor__user",
        ).order_by("-created_at")
        user = self.request.user
        if user.is_superuser or user.role in {user.Role.ADMIN, user.Role.MANAGEMENT, user.Role.HR, user.Role.EHS, user.Role.KAM}:
            return queryset
        if user.role == user.Role.DOCTOR:
            doctor_profile = getattr(user, "doctor_profile", None)
            if doctor_profile:
                return queryset.filter(consulted_doctor=doctor_profile)
        if user.role == user.Role.NURSE:
            # Nurses can see all visits (they create visits for doctors)
            return queryset
        if user.role == user.Role.PHARMACIST:
            return queryset.filter(visit_status=OHCVisit.VisitStatus.IN_PROGRESS)
        if user.role == user.Role.EMPLOYEE:
            employee_profile = getattr(user, "employee_profile", None)
            if employee_profile:
                return queryset.filter(employee=employee_profile)
        return queryset.none()

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return OHCVisitCreateSerializer
        return OHCVisitSerializer

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, HasHealthPortalAccess, IsClinicalOrComplianceStaff])
    def schedule_follow_up(self, request, pk=None):
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
    def dispense(self, request, pk=None):
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
                quantity_remaining=medicine.stock_quantity,
                issue_date=issue_date,
                remarks=remarks,
                status=MedicineDispense.DispenseStatus.DISPENSED,
            )

        return Response({
            "medicine_id": medicine.id,
            "medicine_name": medicine.name,
            "quantity_before": medicine.stock_quantity + quantity,
            "quantity_dispensed": quantity,
            "quantity_remaining": medicine.stock_quantity,
            "issue_date": issue_date,
            "remarks": remarks,
            "message": "Medicine dispensed successfully"
        }, status=status.HTTP_200_OK)


class AnalyticsViewSet(viewsets.GenericViewSet):
    """ViewSet for EHS and Management analytics."""
    permission_classes = [permissions.IsAuthenticated, HasHealthPortalAccess, IsEHSOrManagement]

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

        visits = OHCVisit.objects.all()

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

        # Department-wise visits
        department_wise = list(visits.values("employee__department").annotate(
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
        common_diagnoses = list(diagnoses.values("diagnosis_name").annotate(
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


class MedicineSummaryViewSet(viewsets.GenericViewSet):
    """ViewSet for medicine usage summary (Management only)."""
    permission_classes = [permissions.IsAuthenticated, HasHealthPortalAccess, IsManagement]

    def list(self, request, *args, **kwargs):
        """Get medicine summary data."""
        from django.db.models import Sum, Count

        visits = OHCVisit.objects.all()

        total_ohc_visits = visits.count()

        dispenses = MedicineDispense.objects.all()
        total_medicine_used = dispenses.aggregate(total=Sum("quantity_dispensed"))["total"] or 0

        medicine_stocks = MedicineStock.objects.all()
        stock_summary = {
            "total_items": medicine_stocks.count(),
            "low_stock_items": sum(1 for m in medicine_stocks if m.is_low_stock),
            "expiring_items": sum(1 for m in medicine_stocks if m.is_expiring_soon),
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
