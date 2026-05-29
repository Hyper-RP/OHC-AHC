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
        COMPLETED = "COMPLETED", "Completed"

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
    visit_time = models.TimeField(null=True, blank=True)

    # Patient details (filled by nurse)
    patient_name = models.CharField(max_length=150, blank=True)
    patient_age = models.IntegerField(null=True, blank=True)
    patient_gender = models.CharField(max_length=10, blank=True)
    patient_contact = models.CharField(max_length=20, blank=True)

    # Clinical details (filled by doctor)
    chief_complaint = models.CharField(max_length=255, blank=True)
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
    examination_notes = models.TextField(blank=True, null=True)
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


class MedicineStock(BaseModel):
    """Track medicine inventory with dispensing history."""

    class Unit(models.TextChoices):
        TABLETS = "TABLETS", "Tablets"
        CAPSULES = "CAPSULES", "Capsules"
        SYRUP = "SYRUP", "Syrup (ml)"
        INJECTION = "INJECTION", "Injection (ml)"
        DROPS = "DROPS", "Drops (ml)"
        OINTMENT = "OINTMENT", "Ointment (g)"
        CREAM = "CREAM", "Cream (g)"
        PATCH = "PATCH", "Patch"
        INHALER = "INHALER", "Inhaler (puffs)"

    medicine_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    unit = models.CharField(max_length=20, choices=Unit.choices)
    stock_quantity = models.PositiveIntegerField(default=0)
    initial_stock = models.PositiveIntegerField(default=0)
    used_quantity = models.PositiveIntegerField(default=0)
    supplier = models.CharField(max_length=255, blank=True)
    batch_number = models.CharField(max_length=100, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    reorder_level = models.PositiveIntegerField(default=10)
    last_dispensed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['medicine_id']),
            models.Index(fields=['name']),
            models.Index(fields=['expiry_date']),
            models.Index(fields=['reorder_level', 'stock_quantity']),
        ]

    def __str__(self):
        return f"{self.name} ({self.stock_quantity} {self.unit})"

    @property
    def is_low_stock(self) -> bool:
        """Check if stock is below reorder level."""
        return self.stock_quantity <= self.reorder_level

    @property
    def is_expired(self) -> bool:
        """Check if medicine has expired."""
        if not self.expiry_date:
            return False
        from django.utils import timezone
        return self.expiry_date < timezone.now().date()

    @property
    def is_expiring_soon(self) -> bool:
        """Check if medicine expires within 30 days."""
        if not self.expiry_date:
            return False
        from django.utils import timezone
        from datetime import timedelta
        thirty_days_from_now = timezone.now().date() + timedelta(days=30)
        return self.expiry_date <= thirty_days_from_now


class MedicineDispense(BaseModel):
    """Track medicine dispensing events for pharmacist workflow."""

    class DispenseStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        DISPENSED = "DISPENSED", "Dispensed"
        CANCELLED = "CANCELLED", "Cancelled"

    medicine = models.ForeignKey(
        "ohc.MedicineStock",
        on_delete=models.PROTECT,
        related_name="dispense_records",
    )
    visit = models.ForeignKey(
        "ohc.OHCVisit",
        on_delete=models.CASCADE,
        related_name="medicine_dispenses",
    )
    prescription = models.ForeignKey(
        "ohc.Prescription",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dispenses",
    )
    dispensed_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="dispenses_made",
    )
    quantity_dispensed = models.PositiveIntegerField()
    quantity_remaining = models.PositiveIntegerField()
    issue_date = models.DateField()
    remarks = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=DispenseStatus.choices,
        default=DispenseStatus.DISPENSED,
    )

    def __str__(self):
        return f"{self.medicine.name} - {self.quantity_dispensed} {self.medicine.unit} ({self.issue_date})"


class VisitStatusLog(BaseModel):
    """Track visit status transitions for audit trail."""

    visit = models.ForeignKey(
        "ohc.OHCVisit",
        on_delete=models.CASCADE,
        related_name="status_logs",
    )
    from_status = models.CharField(max_length=20, blank=True)
    to_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="status_changes_made",
    )
    changed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.visit.id}: {self.from_status or 'NEW'} → {self.to_status}"

# Create your models here.
