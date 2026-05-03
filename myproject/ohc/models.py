from django.db import models

from myproject.common_models import BaseModel


class OHCVisit(BaseModel):
    class VisitType(models.TextChoices):
        WALK_IN = "WALK_IN", "Walk In"
        PERIODIC = "PERIODIC", "Periodic Checkup"
        PRE_EMPLOYMENT = "PRE_EMPLOYMENT", "Pre-employment"
        FOLLOW_UP = "FOLLOW_UP", "Follow Up"
        EMERGENCY = "EMERGENCY", "Emergency"

    class VisitStatus(models.TextChoices):
        OPEN = "OPEN", "Open"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        REFERRED = "REFERRED", "Referred"
        CLOSED = "CLOSED", "Closed"
        CANCELLED = "CANCELLED", "Cancelled"

    class TriageLevel(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        CRITICAL = "CRITICAL", "Critical"

    employee = models.ForeignKey("accounts.EmployeeProfile", on_delete=models.PROTECT, related_name="ohc_visits")
    consulted_doctor = models.ForeignKey(
        "accounts.DoctorProfile",
        on_delete=models.PROTECT,
        related_name="ohc_visits",
    )
    visit_type = models.CharField(max_length=30, choices=VisitType.choices, default=VisitType.WALK_IN)
    visit_status = models.CharField(max_length=20, choices=VisitStatus.choices, default=VisitStatus.OPEN)
    triage_level = models.CharField(max_length=10, choices=TriageLevel.choices, default=TriageLevel.LOW)
    visit_date = models.DateTimeField()
    chief_complaint = models.CharField(max_length=255)
    symptoms = models.TextField(blank=True)
    vitals = models.JSONField(default=dict, blank=True)
    preliminary_notes = models.TextField(blank=True)
    requires_referral = models.BooleanField(default=False)
    follow_up_date = models.DateField(null=True, blank=True)
    next_action = models.CharField(max_length=255, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.employee.employee_code} - {self.visit_date:%Y-%m-%d %H:%M}"


class Diagnosis(BaseModel):
    class Severity(models.TextChoices):
        MILD = "MILD", "Mild"
        MODERATE = "MODERATE", "Moderate"
        SERIOUS = "SERIOUS", "Serious"
        CRITICAL = "CRITICAL", "Critical"

    class ConditionStatus(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        STABLE = "STABLE", "Stable"
        RESOLVED = "RESOLVED", "Resolved"
        CHRONIC = "CHRONIC", "Chronic"

    class FitnessDecision(models.TextChoices):
        FIT = "FIT", "Fit"
        FIT_WITH_RESTRICTION = "FIT_WITH_RESTRICTION", "Fit With Restriction"
        TEMPORARY_UNFIT = "TEMPORARY_UNFIT", "Temporary Unfit"
        UNFIT = "UNFIT", "Unfit"

    visit = models.ForeignKey("ohc.OHCVisit", on_delete=models.CASCADE, related_name="diagnoses")
    diagnosed_by = models.ForeignKey(
        "accounts.DoctorProfile",
        on_delete=models.PROTECT,
        related_name="diagnoses_made",
    )
    diagnosis_code = models.CharField(max_length=50, blank=True)
    diagnosis_name = models.CharField(max_length=255)
    diagnosis_notes = models.TextField(blank=True)
    severity = models.CharField(max_length=15, choices=Severity.choices, default=Severity.MILD)
    condition_status = models.CharField(max_length=15, choices=ConditionStatus.choices, default=ConditionStatus.ACTIVE)
    is_primary = models.BooleanField(default=True)
    is_referral_required = models.BooleanField(default=False)
    fitness_decision = models.CharField(
        max_length=30,
        choices=FitnessDecision.choices,
        default=FitnessDecision.FIT,
    )
    work_restrictions = models.TextField(blank=True)
    advised_rest_days = models.PositiveIntegerField(default=0)
    follow_up_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.diagnosis_name


class Prescription(BaseModel):
    class PrescriptionStatus(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        COMPLETED = "COMPLETED", "Completed"
        STOPPED = "STOPPED", "Stopped"

    visit = models.ForeignKey("ohc.OHCVisit", on_delete=models.CASCADE, related_name="prescriptions")
    diagnosis = models.ForeignKey(
        "ohc.Diagnosis",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="prescriptions",
    )
    prescribed_by = models.ForeignKey(
        "accounts.DoctorProfile",
        on_delete=models.PROTECT,
        related_name="prescriptions_written",
    )
    medicine_name = models.CharField(max_length=255)
    dosage = models.CharField(max_length=100)
    frequency = models.CharField(max_length=100)
    duration_days = models.PositiveIntegerField()
    route = models.CharField(max_length=50, blank=True)
    instructions = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=PrescriptionStatus.choices, default=PrescriptionStatus.ACTIVE)

    def __str__(self):
        return self.medicine_name


class MedicalTest(BaseModel):
    class Priority(models.TextChoices):
        ROUTINE = "ROUTINE", "Routine"
        URGENT = "URGENT", "Urgent"
        STAT = "STAT", "STAT"

    class TestStatus(models.TextChoices):
        ORDERED = "ORDERED", "Ordered"
        SAMPLE_COLLECTED = "SAMPLE_COLLECTED", "Sample Collected"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    visit = models.ForeignKey("ohc.OHCVisit", on_delete=models.CASCADE, related_name="medical_tests")
    diagnosis = models.ForeignKey(
        "ohc.Diagnosis",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="medical_tests",
    )
    requested_by = models.ForeignKey(
        "accounts.DoctorProfile",
        on_delete=models.PROTECT,
        related_name="medical_tests_requested",
    )
    test_name = models.CharField(max_length=255)
    test_type = models.CharField(max_length=120)
    laboratory_name = models.CharField(max_length=255, blank=True)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.ROUTINE)
    status = models.CharField(max_length=20, choices=TestStatus.choices, default=TestStatus.ORDERED)
    instructions = models.TextField(blank=True)
    result_summary = models.TextField(blank=True)
    result_value = models.CharField(max_length=120, blank=True)
    result_unit = models.CharField(max_length=50, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.test_name

# Create your models here.
