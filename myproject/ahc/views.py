from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import HasHealthPortalAccess, IsClinicalOrComplianceStaff
from ahc.models import Hospital, MedicalReport, Referral
from ahc.serializers import HospitalSerializer, MedicalReportSerializer, ReferralSerializer


class HospitalViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = HospitalSerializer
    permission_classes = [permissions.IsAuthenticated, HasHealthPortalAccess]
    queryset = Hospital.objects.filter(hospital_status=Hospital.HospitalStatus.ACTIVE).order_by("name")


class ReferralViewSet(viewsets.ModelViewSet):
    serializer_class = ReferralSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy", "select_hospital"}:
            return [permissions.IsAuthenticated(), HasHealthPortalAccess(), IsClinicalOrComplianceStaff()]
        return [permissions.IsAuthenticated(), HasHealthPortalAccess()]

    def get_queryset(self):
        queryset = Referral.objects.select_related(
            "visit",
            "diagnosis",
            "employee",
            "employee__user",
            "referred_by",
            "referred_by__user",
            "hospital",
        ).order_by("-created_at")
        user = self.request.user
        if user.is_superuser or user.role in {user.Role.ADMIN, user.Role.HR, user.Role.EHS, user.Role.KAM}:
            return queryset
        if user.role in {user.Role.DOCTOR, user.Role.NURSE}:
            doctor_profile = getattr(user, "doctor_profile", None)
            if doctor_profile:
                return queryset.filter(referred_by=doctor_profile)
        if user.role == user.Role.EMPLOYEE:
            employee_profile = getattr(user, "employee_profile", None)
            if employee_profile:
                return queryset.filter(employee=employee_profile)
        return queryset.none()

    @action(detail=True, methods=["post"], url_path="select-hospital")
    def select_hospital(self, request, pk=None):
        referral = self.get_object()
        hospital_id = request.data.get("hospital")
        if not hospital_id:
            return Response({"detail": "hospital is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            hospital = Hospital.objects.get(pk=hospital_id, hospital_status=Hospital.HospitalStatus.ACTIVE)
        except Hospital.DoesNotExist:
            return Response({"detail": "Active hospital not found."}, status=status.HTTP_404_NOT_FOUND)

        referral.hospital = hospital
        referral.referral_status = Referral.ReferralStatus.SENT
        referral.save(update_fields=["hospital", "referral_status", "updated_at"])
        return Response(self.get_serializer(referral).data)


class MedicalReportViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = MedicalReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action == "create":
            return [permissions.IsAuthenticated(), HasHealthPortalAccess(), IsClinicalOrComplianceStaff()]
        return [permissions.IsAuthenticated(), HasHealthPortalAccess()]

    def get_queryset(self):
        queryset = MedicalReport.objects.select_related(
            "employee",
            "employee__user",
            "hospital",
            "referral",
            "uploaded_by",
        ).order_by("-report_date", "-created_at")
        user = self.request.user
        if user.is_superuser or user.role in {user.Role.ADMIN, user.Role.HR, user.Role.EHS, user.Role.KAM}:
            return queryset
        if user.role in {user.Role.DOCTOR, user.Role.NURSE}:
            doctor_profile = getattr(user, "doctor_profile", None)
            if doctor_profile and doctor_profile.hospital_id:
                return queryset.filter(hospital=doctor_profile.hospital)
            return queryset.filter(uploaded_by=user)
        if user.role == user.Role.EMPLOYEE:
            employee_profile = getattr(user, "employee_profile", None)
            if employee_profile:
                return queryset.filter(employee=employee_profile)
        return queryset.none()
