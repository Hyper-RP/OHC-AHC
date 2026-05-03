from rest_framework import serializers

from reports.models import AuditLog, Notification


class EmployeeHealthHistorySerializer(serializers.Serializer):
    visit_uuid = serializers.UUIDField()
    visit_date = serializers.DateTimeField()
    visit_status = serializers.CharField()
    doctor_name = serializers.CharField()
    chief_complaint = serializers.CharField()
    diagnosis_name = serializers.CharField(allow_blank=True)
    severity = serializers.CharField(allow_blank=True)
    fitness_decision = serializers.CharField(allow_blank=True)
    follow_up_date = serializers.DateField(allow_null=True)
    referral_status = serializers.CharField(allow_blank=True)
    report_count = serializers.IntegerField()


class DiseaseTrendSerializer(serializers.Serializer):
    diagnosis_name = serializers.CharField()
    severity = serializers.CharField()
    total_cases = serializers.IntegerField()


class DepartmentHealthStatSerializer(serializers.Serializer):
    department = serializers.CharField()
    total_employees = serializers.IntegerField()
    total_visits = serializers.IntegerField()
    referred_cases = serializers.IntegerField()
    unfit_employees = serializers.IntegerField()


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = "__all__"
