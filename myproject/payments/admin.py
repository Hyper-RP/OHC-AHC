from django.contrib import admin

from payments.models import Invoice, Payment


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("invoice_number", "employee", "status", "currency", "total_amount", "due_date")
    list_filter = ("status", "currency")
    search_fields = ("invoice_number", "employee__employee_code", "employee__user__first_name", "employee__user__last_name")


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("invoice", "employee", "amount", "payment_method", "payment_status", "provider")
    list_filter = ("payment_method", "payment_status", "provider")
    search_fields = ("invoice__invoice_number", "employee__employee_code", "provider_payment_id", "transaction_reference")
