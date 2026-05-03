from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

from myproject.common_models import BaseModel


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        NURSE = "NURSE", "Nurse"
        EHS = "EHS", "EHS Team"
        HR = "HR", "HR"
        KAM = "KAM", "KAM"
        DOCTOR = "DOCTOR", "On Site Doctor"
        EMPLOYEE = "EMPLOYEE", "Employee"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices)
    phone_number = models.CharField(max_length=20, blank=True)
    alternate_phone_number = models.CharField(max_length=20, blank=True)
    is_verified = models.BooleanField(default=False)
    must_change_password = models.BooleanField(default=False)
    last_password_changed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.role})"

    def save(self, *args, **kwargs):
        if not self.created_at:
            self.created_at = timezone.now()
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)

    @property
    def is_admin_user(self):
        return self.role == self.Role.ADMIN or self.is_superuser

    @property
    def is_hr_user(self):
        return self.role == self.Role.HR

    @property
    def is_nurse_user(self):
        return self.role == self.Role.NURSE

    @property
    def is_doctor_user(self):
        return self.role == self.Role.DOCTOR

    @property
    def is_ehs_user(self):
        return self.role == self.Role.EHS

    @property
    def is_kam_user(self):
        return self.role == self.Role.KAM

    @property
    def is_employee_user(self):
        return self.role == self.Role.EMPLOYEE

    @property
    def is_clinical_user(self):
        return self.role in {self.Role.NURSE, self.Role.DOCTOR}

    @property
    def is_compliance_user(self):
        return self.role in {self.Role.EHS, self.Role.HR, self.Role.KAM}


class EmployeeProfile(BaseModel):
    class Gender(models.TextChoices):
        MALE = "MALE", "Male"
        FEMALE = "FEMALE", "Female"
        OTHER = "OTHER", "Other"

    class FitnessStatus(models.TextChoices):
        FIT = "FIT", "Fit"
        UNFIT = "UNFIT", "Unfit"
        TEMPORARY_UNFIT = "TEMPORARY_UNFIT", "Temporary Unfit"
        UNDER_OBSERVATION = "UNDER_OBSERVATION", "Under Observation"

    user = models.OneToOneField("accounts.User", on_delete=models.CASCADE, related_name="employee_profile")
    employee_code = models.CharField(max_length=50, unique=True)
    department = models.CharField(max_length=120)
    designation = models.CharField(max_length=120)
    work_location = models.CharField(max_length=120, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, blank=True)
    blood_group = models.CharField(max_length=10, blank=True)
    date_of_joining = models.DateField(null=True, blank=True)
    emergency_contact_name = models.CharField(max_length=120, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    insurance_policy_number = models.CharField(max_length=120, blank=True)
    fitness_status = models.CharField(
        max_length=30,
        choices=FitnessStatus.choices,
        default=FitnessStatus.FIT,
    )
    medical_certificate_expiry = models.DateField(null=True, blank=True)
    entry_restricted_until = models.DateField(null=True, blank=True)
    is_active_employee = models.BooleanField(default=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.employee_code} - {self.user.get_full_name() or self.user.username}"


class DoctorProfile(BaseModel):
    class DoctorType(models.TextChoices):
        OHC = "OHC", "OHC Doctor"
        AHC = "AHC", "AHC Doctor"

    user = models.OneToOneField("accounts.User", on_delete=models.CASCADE, related_name="doctor_profile")
    doctor_type = models.CharField(max_length=10, choices=DoctorType.choices, default=DoctorType.OHC)
    registration_number = models.CharField(max_length=120, unique=True)
    specialization = models.CharField(max_length=150)
    qualification = models.CharField(max_length=255, blank=True)
    years_of_experience = models.PositiveIntegerField(default=0)
    hospital = models.ForeignKey(
        "ahc.Hospital",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="associated_doctors",
    )
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    license_expiry = models.DateField(null=True, blank=True)
    is_available_for_video = models.BooleanField(default=False)
    is_active_doctor = models.BooleanField(default=True)

    def __str__(self):
        prefix = "Nurse" if self.user.role == User.Role.NURSE else "Dr."
        return f"{prefix} {self.user.get_full_name() or self.user.username}"

# Create your models here.
