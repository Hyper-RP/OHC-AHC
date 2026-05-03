from django.contrib import admin

from ahc.models import Hospital, MedicalReport, Referral


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "city", "state", "hospital_status", "supports_cashless")
    list_filter = ("hospital_status", "city", "state", "supports_cashless")
    search_fields = ("name", "code", "city", "state")


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = ("employee", "specialist_department", "priority", "referral_status", "hospital", "created_at")
    list_filter = ("priority", "referral_status", "hospital")
    search_fields = ("employee__employee_code", "employee__user__first_name", "employee__user__last_name", "specialist_department")


@admin.register(MedicalReport)
class MedicalReportAdmin(admin.ModelAdmin):
    list_display = ("title", "employee", "hospital", "report_type", "verification_status", "report_date")
    list_filter = ("report_type", "verification_status", "hospital")
    search_fields = ("title", "employee__employee_code", "employee__user__first_name", "employee__user__last_name")
