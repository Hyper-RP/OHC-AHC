from rest_framework import serializers

from payments.models import Invoice, Payment


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")

class PaymentInitiationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = (
            "invoice",
            "employee",
            "amount",
            "payment_method",
            "provider",
            "transaction_reference",
            "metadata",
        )

    def create(self, validated_data):
        validated_data["payment_status"] = Payment.PaymentStatus.INITIATED
        return Payment.objects.create(**validated_data)

    def validate(self, attrs):
        request = self.context["request"]
        invoice = attrs["invoice"]
        employee = attrs["employee"]

        if invoice.employee_id != employee.id:
            raise serializers.ValidationError("Invoice does not belong to the selected employee.")

        if request.user.role == request.user.Role.EMPLOYEE:
            employee_profile = getattr(request.user, "employee_profile", None)
            if not employee_profile or employee_profile.id != employee.id:
                raise serializers.ValidationError("Employees can only initiate payments for themselves.")
        return attrs