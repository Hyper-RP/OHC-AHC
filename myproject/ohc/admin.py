from django.contrib import admin

from ohc.models import Diagnosis, MedicalTest, OHCVisit, Prescription


@admin.register(OHCVisit)
class OHCVisitAdmin(admin.ModelAdmin):
    list_display = ("employee", "consulted_doctor", "visit_type", "visit_status", "triage_level", "visit_date")
    list_filter = ("visit_type", "visit_status", "triage_level")
    search_fields = ("employee__employee_code", "employee__user__first_name", "employee__user__last_name", "chief_complaint")


@admin.register(Diagnosis)
class DiagnosisAdmin(admin.ModelAdmin):
    list_display = ("diagnosis_name", "visit", "severity", "fitness_decision", "is_referral_required", "follow_up_date")
    list_filter = ("severity", "fitness_decision", "is_referral_required", "condition_status")
    search_fields = ("diagnosis_name", "diagnosis_code", "visit__employee__employee_code")


@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ("medicine_name", "visit", "dosage", "frequency", "duration_days", "status")
    list_filter = ("status",)
    search_fields = ("medicine_name", "visit__employee__employee_code")


@admin.register(MedicalTest)
class MedicalTestAdmin(admin.ModelAdmin):
    list_display = ("test_name", "visit", "priority", "status", "laboratory_name", "completed_at")
    list_filter = ("priority", "status")
    search_fields = ("test_name", "visit__employee__employee_code", "laboratory_name")
