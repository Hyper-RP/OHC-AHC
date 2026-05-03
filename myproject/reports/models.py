from django.db import models

from myproject.common_models import BaseModel


class Notification(BaseModel):
    class NotificationType(models.TextChoices):
        APPOINTMENT = "APPOINTMENT", "Appointment"
        REFERRAL = "REFERRAL", "Referral"
        PAYMENT = "PAYMENT", "Payment"
        REPORT = "REPORT", "Report"
        FITNESS_ALERT = "FITNESS_ALERT", "Fitness Alert"
        GENERAL = "GENERAL", "General"

    class Channel(models.TextChoices):
        IN_APP = "IN_APP", "In App"
        EMAIL = "EMAIL", "Email"
        SMS = "SMS", "SMS"
        WHATSAPP = "WHATSAPP", "WhatsApp"

    class DeliveryStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SENT = "SENT", "Sent"
        FAILED = "FAILED", "Failed"
        READ = "READ", "Read"

    recipient = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NotificationType.choices, default=NotificationType.GENERAL)
    channel = models.CharField(max_length=20, choices=Channel.choices, default=Channel.IN_APP)
    delivery_status = models.CharField(max_length=20, choices=DeliveryStatus.choices, default=DeliveryStatus.PENDING)
    scheduled_for = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    related_model = models.CharField(max_length=100, blank=True)
    related_object_uuid = models.CharField(max_length=64, blank=True)

    def __str__(self):
        return self.title


class AuditLog(BaseModel):
    actor = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    module = models.CharField(max_length=100)
    action = models.CharField(max_length=100)
    target_model = models.CharField(max_length=100)
    target_object_uuid = models.CharField(max_length=64)
    object_snapshot = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    remarks = models.TextField(blank=True)

    def __str__(self):
        return f"{self.module} - {self.action}"

# Create your models here.
