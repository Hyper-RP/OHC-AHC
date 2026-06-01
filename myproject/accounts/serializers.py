from rest_framework import serializers

from accounts.models import DoctorProfile, EmployeeProfile, User


class EmployeeLookupSerializer(serializers.ModelSerializer):
    """Serializer for employee lookup by employee_code."""
    user = serializers.SerializerMethodField()
    phone_number = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeProfile
        fields = [
            'id',
            'employee_code',
            'department',
            'designation',
            'work_location',
            'date_of_birth',
            'gender',
            'user',
            'phone_number',
            'fitness_status',
        ]

    def get_user(self, obj):
        return {
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
        }

    def get_phone_number(self, obj):
        return obj.user.phone_number


class EmployeeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new employee records."""
    user = serializers.SerializerMethodField()
    phone_number = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(write_only=True, required=False)
    first_name = serializers.CharField(write_only=True, max_length=150)
    last_name = serializers.CharField(write_only=True, max_length=150, required=False, allow_blank=True)

    class Meta:
        model = EmployeeProfile
        fields = [
            'id',
            'employee_code',
            'department',
            'designation',
            'work_location',
            'date_of_birth',
            'gender',
            'blood_group',
            'date_of_joining',
            'emergency_contact_name',
            'emergency_contact_phone',
            'insurance_policy_number',
            'fitness_status',
            'is_active_employee',
            'notes',
            'user',
            'phone_number',
            'email',
            'first_name',
            'last_name',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
            'email': obj.user.email,
            'phone_number': obj.user.phone_number,
        }

    def create(self, validated_data):
        # Extract user-related fields
        phone_number = validated_data.pop('phone_number', '')
        email = validated_data.pop('email', '')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name', '')
        employee_code = validated_data.get('employee_code')

        # Create user
        user = User.objects.create(
            username=employee_code,
            first_name=first_name,
            last_name=last_name,
            email=email or f'{employee_code}@temp.local',
            phone_number=phone_number,
            role=User.Role.EMPLOYEE,
            is_verified=True
        )

        # Create employee profile
        employee_profile = EmployeeProfile.objects.create(
            user=user,
            **validated_data
        )

        return employee_profile





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


class DoctorListSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    specializations = serializers.CharField(source='specialization', read_only=True)

    class Meta:
        model = DoctorProfile
        fields = ('id', 'user', 'registration_number', 'specializations')

    def get_user(self, obj):
        return {
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
        }