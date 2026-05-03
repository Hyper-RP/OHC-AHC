from django.contrib import admin

from reports.models import AuditLog, Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "recipient", "notification_type", "channel", "delivery_status", "created_at")
    list_filter = ("notification_type", "channel", "delivery_status")
    search_fields = ("title", "recipient__username", "recipient__first_name", "recipient__last_name")


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("module", "action", "target_model", "actor", "created_at")
    list_filter = ("module", "action", "target_model")
    search_fields = ("module", "action", "target_model", "target_object_uuid", "actor__username")
    readonly_fields = ("created_at", "updated_at")
