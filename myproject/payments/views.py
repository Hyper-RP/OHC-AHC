from django.utils import timezone
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import HasHealthPortalAccess, IsOversightStaff
from payments.models import Invoice, Payment
from payments.serializers import InvoiceSerializer, PaymentInitiationSerializer, PaymentSerializer


class InvoiceViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update"}:
            return [permissions.IsAuthenticated(), HasHealthPortalAccess(), IsOversightStaff()]
        return [permissions.IsAuthenticated(), HasHealthPortalAccess()]

    def get_queryset(self):
        queryset = Invoice.objects.select_related("employee", "employee__user", "visit", "referral").order_by("-created_at")
        user = self.request.user
        if user.is_superuser or user.role in {user.Role.ADMIN, user.Role.HR, user.Role.EHS, user.Role.KAM}:
            return queryset
        employee_profile = getattr(user, "employee_profile", None)
        if employee_profile:
            return queryset.filter(employee=employee_profile)
        return queryset.none()


class PaymentViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        return [permissions.IsAuthenticated(), HasHealthPortalAccess()]

    def get_queryset(self):
        queryset = Payment.objects.select_related("invoice", "employee", "employee__user").order_by("-created_at")
        user = self.request.user
        if user.is_superuser or user.role in {user.Role.ADMIN, user.Role.HR, user.Role.EHS, user.Role.KAM, user.Role.DOCTOR, user.Role.NURSE}:
            return queryset
        employee_profile = getattr(user, "employee_profile", None)
        if employee_profile:
            return queryset.filter(employee=employee_profile)
        return queryset.none()

    def get_serializer_class(self):
        if self.action == "create":
            return PaymentInitiationSerializer
        return PaymentSerializer

    @action(detail=True, methods=["post"], permission_classes=[IsOversightStaff], url_path="mark-success")
    def mark_success(self, request, pk=None):
        payment = self.get_object()
        payment.payment_status = Payment.PaymentStatus.SUCCESS
        payment.paid_at = timezone.now()
        payment.provider_payment_id = request.data.get("provider_payment_id", payment.provider_payment_id)
        payment.provider_signature = request.data.get("provider_signature", payment.provider_signature)
        payment.save(
            update_fields=[
                "payment_status",
                "paid_at",
                "provider_payment_id",
                "provider_signature",
                "updated_at",
            ]
        )

        invoice = payment.invoice
        invoice.status = Invoice.InvoiceStatus.PAID
        invoice.paid_at = payment.paid_at
        invoice.save(update_fields=["status", "paid_at", "updated_at"])
        return Response(PaymentSerializer(payment, context={"request": request}).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[IsOversightStaff], url_path="mark-failed")
    def mark_failed(self, request, pk=None):
        payment = self.get_object()
        payment.payment_status = Payment.PaymentStatus.FAILED
        payment.failure_reason = request.data.get("failure_reason", "")
        payment.save(update_fields=["payment_status", "failure_reason", "updated_at"])
        return Response(PaymentSerializer(payment, context={"request": request}).data, status=status.HTTP_200_OK)
