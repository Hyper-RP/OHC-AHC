from rest_framework import serializers

from accounts.models import DoctorProfile, EmployeeProfile, User


class EmployeeProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeProfile
        fields = (
            "id",
            "user",
            "employee_code",
            "department",
            "designation",
            "work_location",
            "date_of_birth",
            "gender",
            "blood_group",
            "date_of_joining",
            "emergency_contact_name",
            "emergency_contact_phone",
            "insurance_policy_number",
            "fitness_status",
            "medical_certificate_expiry",
            "entry_restricted_until",
            "is_active_employee",
            "notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "user", "created_at", "updated_at")

class DoctorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorProfile
        fields = (
            "id",
            "user",
            "doctor_type",
            "registration_number",
            "specialization",
            "qualification",
            "years_of_experience",
            "hospital",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "user", "hospital", "created_at", "updated_at")

class UserSerializer(serializers.ModelSerializer):
    employee_profile = EmployeeProfileSerializer(read_only=True)
    doctor_profile = DoctorProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "role",
            "phone_number",
            "alternate_phone_number",
            "is_active",
            "is_verified",
            "employee_profile",
            "doctor_profile",
        )

class CurrentUserSerializer(UserSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ("full_name",)

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username