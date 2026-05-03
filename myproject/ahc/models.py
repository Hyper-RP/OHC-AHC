from django.db import models

from myproject.common_models import BaseModel


class Hospital(BaseModel):
    class HospitalStatus(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"
        SUSPENDED = "SUSPENDED", "Suspended"

    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    hospital_status = models.CharField(max_length=15, choices=HospitalStatus.choices, default=HospitalStatus.ACTIVE)
    hospital_type = models.CharField(max_length=100, blank=True)
    contact_person = models.CharField(max_length=120, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address_line_1 = models.CharField(max_length=255)
    address_line_2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, default="India")
    accreditation_number = models.CharField(max_length=120, blank=True)
    specialties = models.JSONField(default=list, blank=True)
    supports_cashless = models.BooleanField(default=False)
    is_available_for_video = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class Referral(BaseModel):
    class ReferralPriority(models.TextChoices):
        NORMAL = "NORMAL", "Normal"
        URGENT = "URGENT", "Urgent"
        EMERGENCY = "EMERGENCY", "Emergency"

    class ReferralStatus(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        PENDING_HOSPITAL_SELECTION = "PENDING_HOSPITAL_SELECTION", "Pending Hospital Selection"
        SENT = "SENT", "Sent"
        ACCEPTED = "ACCEPTED", "Accepted"
        IN_TREATMENT = "IN_TREATMENT", "In Treatment"
        COMPLETED = "COMPLETED", "Completed"
        REJECTED = "REJECTED", "Rejected"
        CANCELLED = "CANCELLED", "Cancelled"

    visit = models.ForeignKey("ohc.OHCVisit", on_delete=models.CASCADE, related_name="referrals")
    diagnosis = models.ForeignKey(
        "ohc.Diagnosis",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="referrals",
    )
    employee = models.ForeignKey("accounts.EmployeeProfile", on_delete=models.PROTECT, related_name="referrals")
    referred_by = models.ForeignKey(
        "accounts.DoctorProfile",
        on_delete=models.PROTECT,
        related_name="referrals_created",
    )
    hospital = models.ForeignKey(
        "ahc.Hospital",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="referrals",
    )
    referral_reason = models.TextField()
    specialist_department = models.CharField(max_length=150, blank=True)
    priority = models.CharField(max_length=20, choices=ReferralPriority.choices, default=ReferralPriority.NORMAL)
    referral_status = models.CharField(
        max_length=40,
        choices=ReferralStatus.choices,
        default=ReferralStatus.PENDING_HOSPITAL_SELECTION,
    )
    appointment_date = models.DateTimeField(null=True, blank=True)
    external_case_id = models.CharField(max_length=120, blank=True)
    treatment_summary = models.TextField(blank=True)
    closure_notes = models.TextField(blank=True)

    def __str__(self):
        return f"Referral {self.uuid} - {self.employee.employee_code}"


class MedicalReport(BaseModel):
    class ReportType(models.TextChoices):
        LAB = "LAB", "Lab Report"
        IMAGING = "IMAGING", "Imaging"
        DISCHARGE = "DISCHARGE", "Discharge Summary"
        FITNESS = "FITNESS", "Fitness Certificate"
        PRESCRIPTION = "PRESCRIPTION", "Prescription"
        OTHER = "OTHER", "Other"

    class VerificationStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        VERIFIED = "VERIFIED", "Verified"
        REJECTED = "REJECTED", "Rejected"

    referral = models.ForeignKey(
        "ahc.Referral",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="medical_reports",
    )
    visit = models.ForeignKey(
        "ohc.OHCVisit",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="medical_reports",
    )
    employee = models.ForeignKey("accounts.EmployeeProfile", on_delete=models.PROTECT, related_name="medical_reports")
    hospital = models.ForeignKey(
        "ahc.Hospital",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="medical_reports",
    )
    uploaded_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="uploaded_medical_reports",
    )
    report_type = models.CharField(max_length=20, choices=ReportType.choices, default=ReportType.OTHER)
    title = models.CharField(max_length=255)
    summary = models.TextField(blank=True)
    report_file = models.FileField(upload_to="medical_reports/")
    report_date = models.DateField()
    is_confidential = models.BooleanField(default=True)
    verification_status = models.CharField(
        max_length=15,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
    )

    def __str__(self):
        return self.title

# Create your models here.
