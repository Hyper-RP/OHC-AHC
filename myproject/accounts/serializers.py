from rest_framework import serializers

from accounts.models import DoctorProfile, EmployeeProfile, User


class EmployeeProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeProfile
        fields = "__all__"
        read_only_fields = ("id", "uuid", "created_at", "updated_at")


class DoctorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorProfile
        fields = "__all__"
        read_only_fields = ("id", "uuid", "created_at", "updated_at")


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
