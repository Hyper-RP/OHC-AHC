from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import EmployeeProfile, DoctorProfile

User = get_user_model()


class BaseModelTests(TestCase):
    """Test that BaseModel no longer has uuid field"""

    def test_employee_profile_no_uuid_field(self):
        """EmployeeProfile should not have uuid field"""
        fields = [f.name for f in EmployeeProfile._meta.get_fields()]
        self.assertNotIn('uuid', fields, "EmployeeProfile should not have uuid field")

    def test_doctor_profile_no_uuid_field(self):
        """DoctorProfile should not have uuid field"""
        fields = [f.name for f in DoctorProfile._meta.get_fields()]
        self.assertNotIn('uuid', fields, "DoctorProfile should not have uuid field")

    def test_employee_profile_has_id_field(self):
        """EmployeeProfile should have id field"""
        fields = [f.name for f in EmployeeProfile._meta.get_fields()]
        self.assertIn('id', fields, "EmployeeProfile should have id field")

    def test_doctor_profile_has_id_field(self):
        """DoctorProfile should have id field"""
        fields = [f.name for f in DoctorProfile._meta.get_fields()]
        self.assertIn('id', fields, "DoctorProfile should have id field")


class ModelCreationTests(TestCase):
    """Test model creation without uuid"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role=User.Role.EMPLOYEE
        )

    def test_employee_profile_created_without_uuid(self):
        """EmployeeProfile should be created without uuid"""
        profile = EmployeeProfile.objects.create(
            user=self.user,
            employee_code='EMP001',
            department='IT',
            designation='Developer'
        )
        self.assertIsNotNone(profile.id)
        self.assertEqual(profile.employee_code, 'EMP001')

    def test_doctor_profile_created_without_uuid(self):
        """User with doctor role should work"""
        doctor_user = User.objects.create_user(
            username='doctor',
            email='doctor@example.com',
            password='testpass123',
            role=User.Role.DOCTOR
        )
        profile = DoctorProfile.objects.create(
            user=doctor_user,
            doctor_type=DoctorProfile.DoctorType.OHC,
            registration_number='DOC001',
            specialization='General Medicine'
        )
        self.assertIsNotNone(profile.id)
        self.assertEqual(profile.registration_number, 'DOC001')


class APITests(TestCase):
    """Test API responses don't include uuid"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role=User.Role.ADMIN,
            is_staff=True
        )
        self.client.force_authenticate(user=self.user)

        self.employee = User.objects.create_user(
            username='employee',
            email='employee@example.com',
            password='testpass123',
            role=User.Role.EMPLOYEE
        )
        self.employee_profile = EmployeeProfile.objects.create(
            user=self.employee,
            employee_code='EMP001',
            department='IT',
            designation='Developer'
        )

    def test_user_list_response_no_uuid(self):
        """GET /api/accounts/me/ should not include uuid"""
        response = self.client.get('/api/accounts/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('uuid', response.data, "User response should not include uuid")

    def test_employee_detail_response_no_uuid(self):
        """GET /api/accounts/me/ with employee profile should not include uuid"""
        self.client.force_authenticate(user=self.employee)
        response = self.client.get('/api/accounts/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if 'employee_profile' in response.data:
            self.assertNotIn('uuid', response.data['employee_profile'], "Employee profile should not include uuid")
            self.assertIn('id', response.data['employee_profile'], "Employee profile should include id")
            self.assertIn('employee_code', response.data['employee_profile'], "Employee profile should include employee_code")

    def test_employee_profile_nested_no_uuid(self):
        """Nested employee_profile should not include uuid"""
        self.client.force_authenticate(user=self.employee)
        response = self.client.get('/api/accounts/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if 'employee_profile' in response.data:
            self.assertNotIn('uuid', response.data['employee_profile'], "Employee profile should not include uuid")


class ForeignKeyTests(TestCase):
    """Test foreign key relationships work without uuid"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role=User.Role.ADMIN
        )
        self.employee = User.objects.create_user(
            username='employee',
            email='employee@example.com',
            password='testpass123',
            role=User.Role.EMPLOYEE
        )
        self.employee_profile = EmployeeProfile.objects.create(
            user=self.employee,
            employee_code='EMP001',
            department='IT',
            designation='Developer'
        )
        self.doctor_user = User.objects.create_user(
            username='doctor',
            email='doctor@example.com',
            password='testpass123',
            role=User.Role.DOCTOR
        )
        self.doctor_profile = DoctorProfile.objects.create(
            user=self.doctor_user,
            doctor_type=DoctorProfile.DoctorType.OHC,
            registration_number='DOC001',
            specialization='General Medicine'
        )

    def test_employee_profile_user_fk(self):
        """EmployeeProfile user foreign key should work"""
        self.assertEqual(self.employee_profile.user, self.employee)

    def test_employee_profile_user_id_fk(self):
        """EmployeeProfile user_id should be correct"""
        self.assertEqual(self.employee_profile.user_id, self.employee.id)

    def test_doctor_profile_user_fk(self):
        """DoctorProfile user foreign key should work"""
        self.assertEqual(self.doctor_profile.user, self.doctor_user)

    def test_reverse_relation_user_employee_profile(self):
        """User -> employee_profile reverse relation should work"""
        self.assertEqual(self.employee.employee_profile, self.employee_profile)

    def test_reverse_relation_user_doctor_profile(self):
        """User -> doctor_profile reverse relation should work"""
        self.assertEqual(self.doctor_user.doctor_profile, self.doctor_profile)