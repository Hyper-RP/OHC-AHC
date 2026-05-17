from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import EmployeeProfile, DoctorProfile, User
from ohc.models import OHCVisit, Diagnosis, Prescription, MedicalTest


class OHCModelTests(TestCase):
    """Test OHC models don't have uuid field"""

    def test_ohc_visit_no_uuid_field(self):
        """OHCVisit should not have uuid field"""
        fields = [f.name for f in OHCVisit._meta.get_fields()]
        self.assertNotIn('uuid', fields, "OHCVisit should not have uuid field")
        self.assertIn('id', fields, "OHCVisit should have id field")

    def test_diagnosis_no_uuid_field(self):
        """Diagnosis should not have uuid field"""
        fields = [f.name for f in Diagnosis._meta.get_fields()]
        self.assertNotIn('uuid', fields, "Diagnosis should not have uuid field")
        self.assertIn('id', fields, "Diagnosis should have id field")

    def test_prescription_no_uuid_field(self):
        """Prescription should not have uuid field"""
        fields = [f.name for f in Prescription._meta.get_fields()]
        self.assertNotIn('uuid', fields, "Prescription should not have uuid field")
        self.assertIn('id', fields, "Prescription should have id field")

    def test_medical_test_no_uuid_field(self):
        """MedicalTest should not have uuid field"""
        fields = [f.name for f in MedicalTest._meta.get_fields()]
        self.assertNotIn('uuid', fields, "MedicalTest should not have uuid field")
        self.assertIn('id', fields, "MedicalTest should have id field")


class OHCCreationTests(TestCase):
    """Test OHC models can be created without uuid"""

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

    def test_ohc_visit_created(self):
        """OHCVisit should be created without uuid"""
        visit = OHCVisit.objects.create(
            employee=self.employee_profile,
            consulted_doctor=self.doctor_profile,
            visit_type=OHCVisit.VisitType.WALK_IN,
            visit_date='2026-05-16T10:00:00Z',
            chief_complaint='Headache'
        )
        self.assertIsNotNone(visit.id)
        self.assertEqual(visit.chief_complaint, 'Headache')

    def test_diagnosis_created(self):
        """Diagnosis should be created without uuid"""
        visit = OHCVisit.objects.create(
            employee=self.employee_profile,
            consulted_doctor=self.doctor_profile,
            visit_type=OHCVisit.VisitType.WALK_IN,
            visit_date='2026-05-16T10:00:00Z',
            chief_complaint='Headache'
        )
        diagnosis = Diagnosis.objects.create(
            visit=visit,
            diagnosed_by=self.doctor_profile,
            diagnosis_name='Migraine',
            severity=Diagnosis.Severity.MILD
        )
        self.assertIsNotNone(diagnosis.id)
        self.assertEqual(diagnosis.diagnosis_name, 'Migraine')

    def test_prescription_created(self):
        """Prescription should be created without uuid"""
        visit = OHCVisit.objects.create(
            employee=self.employee_profile,
            consulted_doctor=self.doctor_profile,
            visit_type=OHCVisit.VisitType.WALK_IN,
            visit_date='2026-05-16T10:00:00Z',
            chief_complaint='Headache'
        )
        prescription = Prescription.objects.create(
            visit=visit,
            prescribed_by=self.doctor_profile,
            medicine_name='Paracetamol',
            dosage='500mg',
            frequency='3 times a day',
            duration_days=3,
            start_date='2026-05-16'
        )
        self.assertIsNotNone(prescription.id)
        self.assertEqual(prescription.medicine_name, 'Paracetamol')


class OHCApiTests(TestCase):
    """Test OHC API responses don't include uuid"""

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

    def test_ohc_visit_list_response_no_uuid(self):
        """GET /api/ohc/visits/ should not include uuid"""
        response = self.client.get('/api/ohc/visits/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if response.data and len(response.data) > 0:
            visit_data = response.data[0]
            self.assertNotIn('uuid', visit_data, "Visit response should not include uuid")

    def test_diagnosis_list_response_no_uuid(self):
        """POST /api/ohc/diagnosis-prescriptions/ should not include uuid in response"""
        # Create a visit first
        visit = OHCVisit.objects.create(
            employee=self.employee_profile,
            consulted_doctor=self.doctor_profile,
            visit_type=OHCVisit.VisitType.WALK_IN,
            visit_date='2026-05-16T10:00:00Z',
            chief_complaint='Headache'
        )
        response = self.client.post('/api/ohc/diagnosis-prescriptions/', {
            'diagnosis': {
                'visit': visit.id,
                'diagnosed_by': self.doctor_profile.id,
                'diagnosis_name': 'Migraine',
                'severity': 'MILD',
                'diagnosis_notes': 'Patient reports recurring headaches'
            },
            'prescriptions': [
                {
                    'medicine_name': 'Paracetamol',
                    'dosage': '500mg',
                    'frequency': '3 times a day',
                    'duration_days': 3,
                    'start_date': '2026-05-16'
                }
            ]
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn('uuid', response.data.get('diagnosis', {}), "Diagnosis response should not include uuid")


class OHCForeignKeyTests(TestCase):
    """Test OHC foreign key relationships work without uuid"""

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

    def test_diagnosis_visit_fk(self):
        """Diagnosis visit foreign key should work"""
        visit = OHCVisit.objects.create(
            employee=self.employee_profile,
            consulted_doctor=self.doctor_profile,
            visit_type=OHCVisit.VisitType.WALK_IN,
            visit_date='2026-05-16T10:00:00Z',
            chief_complaint='Headache'
        )
        diagnosis = Diagnosis.objects.create(
            visit=visit,
            diagnosed_by=self.doctor_profile,
            diagnosis_name='Migraine'
        )
        self.assertEqual(diagnosis.visit, visit)
        self.assertEqual(diagnosis.visit_id, visit.id)

    def test_prescription_visit_fk(self):
        """Prescription visit foreign key should work"""
        visit = OHCVisit.objects.create(
            employee=self.employee_profile,
            consulted_doctor=self.doctor_profile,
            visit_type=OHCVisit.VisitType.WALK_IN,
            visit_date='2026-05-16T10:00:00Z',
            chief_complaint='Headache'
        )
        prescription = Prescription.objects.create(
            visit=visit,
            prescribed_by=self.doctor_profile,
            medicine_name='Paracetamol',
            dosage='500mg',
            frequency='3 times a day',
            duration_days=3,
            start_date='2026-05-16'
        )
        self.assertEqual(prescription.visit, visit)
        self.assertEqual(prescription.visit_id, visit.id)