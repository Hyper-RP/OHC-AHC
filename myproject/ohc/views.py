from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response

from accounts.permissions import HasHealthPortalAccess, IsClinicalOrComplianceStaff, IsClinicalStaff
from ohc.models import MedicalTest, OHCVisit
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
        ).order_by("-visit_date")
        user = self.request.user
        if user.is_superuser or user.role in {user.Role.ADMIN, user.Role.HR, user.Role.EHS, user.Role.KAM}:
            return queryset
        if user.role in {user.Role.DOCTOR, user.Role.NURSE}:
            doctor_profile = getattr(user, "doctor_profile", None)
            if doctor_profile:
                return queryset.filter(consulted_doctor=doctor_profile)
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
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        diagnosis = serializer.save()
        return Response(
            self.get_serializer(diagnosis).data,
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
        if user.is_superuser or user.role in {user.Role.ADMIN, user.Role.HR, user.Role.EHS, user.Role.KAM}:
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
            self.get_serializer(diagnosis).data,
            status=status.HTTP_201_CREATED,
        )

