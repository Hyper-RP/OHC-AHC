from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import EmployeeProfile, DoctorProfile, User
from ahc.models import Hospital, Referral, MedicalReport
from ohc.models import OHCVisit


class AHCModelTests(TestCase):
    """Test AHC models don't have uuid field"""

    def test_hospital_no_uuid_field(self):
        """Hospital should not have uuid field"""
        fields = [f.name for f in Hospital._meta.get_fields()]
        self.assertNotIn('uuid', fields, "Hospital should not have uuid field")
        self.assertIn('id', fields, "Hospital should have id field")

    def test_referral_no_uuid_field(self):
        """Referral should not have uuid field"""
        fields = [f.name for f in Referral._meta.get_fields()]
        self.assertNotIn('uuid', fields, "Referral should not have uuid field")
        self.assertIn('id', fields, "Referral should have id field")

    def test_medical_report_no_uuid_field(self):
        """MedicalReport should not have uuid field"""
        fields = [f.name for f in MedicalReport._meta.get_fields()]
        self.assertNotIn('uuid', fields, "MedicalReport should not have uuid field")
        self.assertIn('id', fields, "MedicalReport should have id field")


class AHCCreationTests(TestCase):
    """Test AHC models can be created without uuid"""

    def setUp(self):
        self.employee_user = User.objects.create_user(
            username='employee',
            email='employee@example.com',
            password='testpass123',
            role=User.Role.EMPLOYEE
        )
        self.employee_profile = EmployeeProfile.objects.create(
            user=self.employee_user,
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
        self.hospital = Hospital.objects.create(
            name='City Hospital',
            code='HOSP001',
            address_line_1='123 Main St',
            city='New York',
            state='NY',
            postal_code='10001'
        )

    def test_hospital_created(self):
        """Hospital should be created without uuid"""
        self.assertIsNotNone(self.hospital.id)
        self.assertEqual(self.hospital.name, 'City Hospital')

    def test_referral_created(self):
        """Referral should be created without uuid"""
        # Create a visit first since Referral requires a visit
        visit = OHCVisit.objects.create(
            employee=self.employee_profile,
            consulted_doctor=self.doctor_profile,
            visit_type=OHCVisit.VisitType.WALK_IN,
            visit_date='2026-05-16T10:00:00Z',
            chief_complaint='Headache'
        )
        referral = Referral.objects.create(
            visit=visit,
            employee=self.employee_profile,
            referred_by=self.doctor_profile,
            hospital=self.hospital,
            referral_reason='Specialist consultation required'
        )
        self.assertIsNotNone(referral.id)
        self.assertEqual(referral.referral_reason, 'Specialist consultation required')


class AHCApiTests(TestCase):
    """Test AHC API responses don't include uuid"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='testpass123',
            role=User.Role.ADMIN,
            is_staff=True
        )
        self.client.force_authenticate(user=self.user)

    def test_hospital_list_response_no_uuid(self):
        """GET /api/ahc/hospitals/ should not include uuid"""
        response = self.client.get('/api/ahc/hospitals/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if response.data and len(response.data) > 0:
            hospital_data = response.data[0]
            self.assertNotIn('uuid', hospital_data, "Hospital response should not include uuid")

    def test_referral_list_response_no_uuid(self):
        """GET /api/ahc/referrals/ should not include uuid"""
        response = self.client.get('/api/ahc/referrals/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if response.data and len(response.data) > 0:
            referral_data = response.data[0]
            self.assertNotIn('uuid', referral_data, "Referral response should not include uuid")


class AHCForeignKeyTests(TestCase):
    """Test AHC foreign key relationships work without uuid"""

    def setUp(self):
        self.employee_user = User.objects.create_user(
            username='employee',
            email='employee@example.com',
            password='testpass123',
            role=User.Role.EMPLOYEE
        )
        self.employee_profile = EmployeeProfile.objects.create(
            user=self.employee_user,
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
        self.hospital = Hospital.objects.create(
            name='City Hospital',
            code='HOSP001',
            address_line_1='123 Main St',
            city='New York',
            state='NY',
            postal_code='10001'
        )

    def test_referral_hospital_fk(self):
        """Referral hospital foreign key should work"""
        # Create a visit first since Referral requires a visit
        visit = OHCVisit.objects.create(
            employee=self.employee_profile,
            consulted_doctor=self.doctor_profile,
            visit_type=OHCVisit.VisitType.WALK_IN,
            visit_date='2026-05-16T10:00:00Z',
            chief_complaint='Headache'
        )
        referral = Referral.objects.create(
            visit=visit,
            employee=self.employee_profile,
            referred_by=self.doctor_profile,
            hospital=self.hospital,
            referral_reason='Specialist consultation required'
        )
        self.assertEqual(referral.hospital, self.hospital)
        self.assertEqual(referral.hospital_id, self.hospital.id)

    def test_hospital_associated_doctors(self):
        """Hospital associated_doctors reverse relation should work"""
        hospital = Hospital.objects.create(
            name='Another Hospital',
            code='HOSP002',
            address_line_1='456 Oak Ave',
            city='Boston',
            state='MA',
            postal_code='02101'
        )
        self.doctor_profile.hospital = hospital
        self.doctor_profile.save()
        self.assertIn(self.doctor_profile, hospital.associated_doctors.all())