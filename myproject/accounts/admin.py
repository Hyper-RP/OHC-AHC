from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from accounts.models import DoctorProfile, EmployeeProfile, User


class EmployeeProfileInline(admin.StackedInline):
    model = EmployeeProfile
    extra = 0
    fk_name = "user"


class DoctorProfileInline(admin.StackedInline):
    model = DoctorProfile
    extra = 0
    fk_name = "user"


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "role",
        "is_active",
        "is_staff",
    )
    list_filter = ("role", "is_active", "is_staff", "is_superuser")
    search_fields = ("username", "email", "first_name", "last_name", "phone_number")
    ordering = ("username",)
    inlines = (EmployeeProfileInline, DoctorProfileInline)

    fieldsets = (
        ("Login Credentials", {"fields": ("username", "password")}),
        (
            "Role Assignment",
            {
                "fields": ("role",),
                "description": "Pick the business role here. In most cases, you do not need to assign raw permissions manually.",
            },
        ),
        (
            "Basic Info",
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "email",
                    "phone_number",
                    "alternate_phone_number",
                )
            },
        ),
        (
            "Account Status",
            {
                "fields": (
                    "is_active",
                    "is_verified",
                    "must_change_password",
                    "last_password_changed_at",
                    "created_at",
                    "updated_at",
                    "last_login",
                )
            },
        ),
        (
            "Admin Access",
            {
                "fields": ("is_staff", "is_superuser"),
                "description": "Use only for admin panel access and platform-level control.",
            },
        ),
        (
            "Advanced Permissions",
            {
                "classes": ("collapse",),
                "fields": ("groups", "user_permissions"),
                "description": "Advanced only. Prefer the Role field above unless you have a special case.",
            },
        ),
    )

    add_fieldsets = (
        (
            "Create User",
            {
                "classes": ("wide",),
                "fields": (
                    "username",
                    "email",
                    "first_name",
                    "last_name",
                    "role",
                    "phone_number",
                    "password1",
                    "password2",
                    "is_active",
                    "is_staff",
                ),
                "description": "Create the user first, then fill Employee or Doctor profile details below on the edit screen.",
            },
        ),
    )
    readonly_fields = ("created_at", "updated_at", "last_login", "last_password_changed_at")


@admin.register(EmployeeProfile)
class EmployeeProfileAdmin(admin.ModelAdmin):
    list_display = ("employee_code", "user", "department", "designation", "fitness_status", "is_active_employee")
    list_filter = ("department", "fitness_status", "is_active_employee")
    search_fields = ("employee_code", "user__username", "user__first_name", "user__last_name")


@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "doctor_type", "specialization", "registration_number", "is_active_doctor")
    list_filter = ("doctor_type", "is_active_doctor", "is_available_for_video")
    search_fields = ("user__username", "user__first_name", "user__last_name", "registration_number", "specialization")
