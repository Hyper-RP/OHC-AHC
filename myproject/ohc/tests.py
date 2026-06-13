from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import EmployeeProfile, DoctorProfile, User
from ohc.models import OHCVisit, Diagnosis, Prescription, MedicalTest, MedicineStock, MedicineDispense


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
            'visit': visit.id,
            'diagnosis_name': 'Migraine',
            'severity': 'MILD',
            'fitness_decision': 'FIT',
            'diagnosis_notes': 'Patient reports recurring headaches',
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


# Phase 5 Testing - OHC Visit Workflow Tests


class OHCVisitWorkflowTests(TestCase):
    """Test OHC visit status transitions and workflow logic."""

    def setUp(self):
        from django.utils import timezone

        self.employee_user = User.objects.create_user(
            username='employee',
            email='employee@example.com',
            password='testpass123',
            role=User.Role.EMPLOYEE
        )
        self.employee_profile = EmployeeProfile.objects.create(
            user=self.employee_user,
            employee_code='EMP001',
            department='Manufacturing',
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

        self.nurse_user = User.objects.create_user(
            username='nurse',
            email='nurse@example.com',
            password='testpass123',
            role=User.Role.NURSE
        )

        self.pharmacist_user = User.objects.create_user(
            username='pharmacist',
            email='pharmacist@example.com',
            password='testpass123',
            role=User.Role.PHARMACIST
        )

        self.visit_date = timezone.now()

    def test_visit_status_open_to_in_progress(self):
        """Test that visit can transition from OPEN to IN_PROGRESS."""
        visit = OHCVisit.objects.create(
            employee=self.employee_profile,
            consulted_doctor=self.doctor_profile,
            visit_status=OHCVisit.VisitStatus.OPEN,
            visit_date=self.visit_date,
            chief_complaint='Headache',
            vitals={'temperature': '98.6', 'blood_pressure': '120/80'}
        )

        visit.visit_status = OHCVisit.VisitStatus.IN_PROGRESS
        visit.save()

        self.assertEqual(visit.visit_status, OHCVisit.VisitStatus.IN_PROGRESS)

    def test_visit_status_in_progress_to_completed(self):
        """Test that visit can transition from IN_PROGRESS to COMPLETED."""
        visit = OHCVisit.objects.create(
            employee=self.employee_profile,
            consulted_doctor=self.doctor_profile,
            visit_status=OHCVisit.VisitStatus.IN_PROGRESS,
            visit_date=self.visit_date,
            chief_complaint='Headache',
        )

        from django.utils import timezone
        visit.visit_status = OHCVisit.VisitStatus.COMPLETED
        visit.closed_at = timezone.now()
        visit.save()

        self.assertEqual(visit.visit_status, OHCVisit.VisitStatus.COMPLETED)
        self.assertIsNotNone(visit.closed_at)

    def test_triage_level_enum_values(self):
        """Test that all triage level enum values are valid."""
        valid_levels = [
            OHCVisit.TriageLevel.LOW,
            OHCVisit.TriageLevel.MEDIUM,
            OHCVisit.TriageLevel.HIGH,
            OHCVisit.TriageLevel.CRITICAL,
        ]

        for level in valid_levels:
            visit = OHCVisit.objects.create(
                employee=self.employee_profile,
                consulted_doctor=self.doctor_profile,
                triage_level=level,
                visit_status=OHCVisit.VisitStatus.OPEN,
                visit_date=self.visit_date,
            )
            self.assertEqual(visit.triage_level, level)


class DiagnosisWorkflowTests(TestCase):
    """Test Diagnosis model severity and fitness decision enums."""

    def setUp(self):
        from django.utils import timezone

        self.employee_user = User.objects.create_user(
            username='employee',
            email='employee@example.com',
            password='testpass123',
            role=User.Role.EMPLOYEE
        )
        self.employee_profile = EmployeeProfile.objects.create(
            user=self.employee_user,
            employee_code='EMP001',
            department='Manufacturing',
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

        self.visit = OHCVisit.objects.create(
            employee=self.employee_profile,
            consulted_doctor=self.doctor_profile,
            visit_status=OHCVisit.VisitStatus.OPEN,
            visit_date=timezone.now(),
        )

    def test_severity_enum_values(self):
        """Test that all severity enum values are valid."""
        valid_severities = [
            Diagnosis.Severity.MILD,
            Diagnosis.Severity.MODERATE,
            Diagnosis.Severity.SERIOUS,
            Diagnosis.Severity.CRITICAL,
        ]

        for severity in valid_severities:
            diagnosis = Diagnosis.objects.create(
                visit=self.visit,
                diagnosed_by=self.doctor_profile,
                diagnosis_name='Test Diagnosis',
                severity=severity,
            )
            self.assertEqual(diagnosis.severity, severity)

    def test_fitness_decision_enum_values(self):
        """Test that all fitness decision enum values are valid."""
        valid_decisions = [
            Diagnosis.FitnessDecision.FIT,
            Diagnosis.FitnessDecision.FIT_WITH_RESTRICTION,
            Diagnosis.FitnessDecision.TEMPORARY_UNFIT,
            Diagnosis.FitnessDecision.UNFIT,
        ]

        for decision in valid_decisions:
            diagnosis = Diagnosis.objects.create(
                visit=self.visit,
                diagnosed_by=self.doctor_profile,
                diagnosis_name='Test Diagnosis',
                fitness_decision=decision,
            )
            self.assertEqual(diagnosis.fitness_decision, decision)


class MedicineStockTests(TestCase):
    """Test MedicineStock model business logic."""

    def setUp(self):
        from datetime import date, timedelta

        self.medicine = MedicineStock.objects.create(
            medicine_id='MED001',
            name='Paracetamol',
            unit=MedicineStock.Unit.TABLETS,
            stock_quantity=100,
            initial_stock=200,
            supplier='PharmaCorp',
            batch_number='BATCH123',
            expiry_date=date.today() + timedelta(days=90),
            reorder_level=10,
        )

    def test_is_low_stock_below_reorder_level(self):
        """Test low stock flag when below reorder level."""
        self.medicine.stock_quantity = 5
        self.medicine.save()
        self.assertTrue(self.medicine.is_low_stock)

    def test_is_low_stock_false_above_reorder_level(self):
        """Test low stock flag false when above reorder level."""
        self.medicine.stock_quantity = 15
        self.medicine.save()
        self.assertFalse(self.medicine.is_low_stock)

    def test_is_expired_when_passed(self):
        """Test expired flag when expiry date passed."""
        from datetime import date, timedelta
        self.medicine.expiry_date = date.today() - timedelta(days=1)
        self.medicine.save()
        self.assertTrue(self.medicine.is_expired)

    def test_is_expired_false_future(self):
        """Test expired flag false when expiry in future."""
        from datetime import date, timedelta
        self.medicine.expiry_date = date.today() + timedelta(days=30)
        self.medicine.save()
        self.assertFalse(self.medicine.is_expired)

    def test_is_expiring_soon_within_30_days(self):
        """Test expiring soon flag within 30 days."""
        from datetime import date, timedelta
        self.medicine.expiry_date = date.today() + timedelta(days=25)
        self.medicine.save()
        self.assertTrue(self.medicine.is_expiring_soon)

    def test_is_expiring_soon_false_after_30_days(self):
        """Test expiring soon flag false after 30 days."""
        from datetime import date, timedelta
        self.medicine.expiry_date = date.today() + timedelta(days=60)
        self.medicine.save()
        self.assertFalse(self.medicine.is_expiring_soon)


class MedicineDispenseTests(TestCase):
    """Test MedicineDispense model and records."""

    def setUp(self):
        from datetime import date, timedelta
        from django.utils import timezone

        self.user = User.objects.create_user(
            username='pharmacist',
            email='pharmacist@example.com',
            password='testpass123',
            role=User.Role.PHARMACIST
        )

        self.medicine = MedicineStock.objects.create(
            medicine_id='MED001',
            name='Paracetamol',
            unit=MedicineStock.Unit.TABLETS,
            stock_quantity=100,
            initial_stock=200,
            supplier='PharmaCorp',
            batch_number='BATCH123',
            expiry_date=date.today() + timedelta(days=90),
            reorder_level=10,
        )

        self.employee_user = User.objects.create_user(
            username='employee',
            email='employee@example.com',
            password='testpass123',
            role=User.Role.EMPLOYEE
        )
        self.employee_profile = EmployeeProfile.objects.create(
            user=self.employee_user,
            employee_code='EMP001',
            department='Manufacturing',
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

        self.visit = OHCVisit.objects.create(
            employee=self.employee_profile,
            consulted_doctor=self.doctor_profile,
            visit_status=OHCVisit.VisitStatus.IN_PROGRESS,
            visit_date=timezone.now(),
        )

        self.diagnosis = Diagnosis.objects.create(
            visit=self.visit,
            diagnosed_by=self.doctor_profile,
            diagnosis_name='Headache',
        )

        self.prescription = Prescription.objects.create(
            visit=self.visit,
            diagnosis=self.diagnosis,
            prescribed_by=self.doctor_profile,
            medicine_name='Paracetamol',
            dosage='500mg',
            frequency='Three times daily',
            duration_days=7,
            start_date=date.today(),
        )

    def test_dispense_creates_record(self):
        """Test that dispensing creates a dispense record."""
        from datetime import date
        from ohc.models import MedicineDispense

        dispense = MedicineDispense.objects.create(
            medicine=self.medicine,
            visit=self.visit,
            prescription=self.prescription,
            dispensed_by=self.user,
            quantity_dispensed=5,
            quantity_remaining=95,
            issue_date=date.today(),
            remarks='Dispensed for headache treatment',
            status=MedicineDispense.DispenseStatus.DISPENSED,
        )

        self.assertEqual(dispense.quantity_dispensed, 5)
        self.assertEqual(dispense.quantity_remaining, 95)
        self.assertEqual(dispense.status, MedicineDispense.DispenseStatus.DISPENSED)


class ViewSetTests(TestCase):
    """Test ViewSet actions and role-based filtering."""

    def setUp(self):
        from datetime import date, timedelta
        from django.utils import timezone

        # Create users for each role
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='testpass123',
            role=User.Role.ADMIN
        )

        self.nurse_user = User.objects.create_user(
            username='nurse',
            email='nurse@example.com',
            password='testpass123',
            role=User.Role.NURSE
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

        self.doctor2_user = User.objects.create_user(
            username='doctor2',
            email='doctor2@example.com',
            password='testpass123',
            role=User.Role.DOCTOR
        )
        self.doctor2_profile = DoctorProfile.objects.create(
            user=self.doctor2_user,
            doctor_type=DoctorProfile.DoctorType.OHC,
            registration_number='DOC002',
            specialization='Pediatrics'
        )

        self.pharmacist_user = User.objects.create_user(
            username='pharmacist',
            email='pharmacist@example.com',
            password='testpass123',
            role=User.Role.PHARMACIST
        )

        self.ehs_user = User.objects.create_user(
            username='ehs',
            email='ehs@example.com',
            password='testpass123',
            role=User.Role.EHS
        )

        self.management_user = User.objects.create_user(
            username='manager',
            email='manager@example.com',
            password='testpass123',
            role=User.Role.MANAGEMENT
        )

        self.employee_user = User.objects.create_user(
            username='employee',
            email='employee@example.com',
            password='testpass123',
            role=User.Role.EMPLOYEE
        )
        self.employee_profile = EmployeeProfile.objects.create(
            user=self.employee_user,
            employee_code='EMP001',
            department='Manufacturing',
        )

        # Create visits
        self.visit1 = OHCVisit.objects.create(
            employee=self.employee_profile,
            consulted_doctor=self.doctor_profile,
            visit_status=OHCVisit.VisitStatus.OPEN,
            visit_date=timezone.now(),
            chief_complaint='Headache',
        )

        self.visit2 = OHCVisit.objects.create(
            employee=self.employee_profile,
            consulted_doctor=self.doctor2_profile,
            visit_status=OHCVisit.VisitStatus.IN_PROGRESS,
            visit_date=timezone.now(),
            chief_complaint='Fever',
        )

        self.visit3 = OHCVisit.objects.create(
            employee=self.employee_profile,
            consulted_doctor=self.doctor_profile,
            visit_status=OHCVisit.VisitStatus.COMPLETED,
            visit_date=timezone.now(),
            chief_complaint='Cold',
            closed_at=timezone.now(),
        )

        # Create diagnosis and prescription for visit2 (IN_PROGRESS)
        self.diagnosis = Diagnosis.objects.create(
            visit=self.visit2,
            diagnosed_by=self.doctor2_profile,
            diagnosis_name='Fever',
        )

        self.prescription = Prescription.objects.create(
            visit=self.visit2,
            diagnosis=self.diagnosis,
            prescribed_by=self.doctor2_profile,
            medicine_name='Paracetamol',
            dosage='500mg',
            frequency='Three times daily',
            duration_days=7,
            start_date=date.today(),
        )

        # Create medicine stock
        self.medicine = MedicineStock.objects.create(
            medicine_id='MED001',
            name='Paracetamol',
            unit=MedicineStock.Unit.TABLETS,
            stock_quantity=100,
            initial_stock=200,
            supplier='PharmaCorp',
            batch_number='BATCH123',
            expiry_date=date.today() + timedelta(days=90),
            reorder_level=10,
        )

    def test_doctor_sees_only_assigned_visits(self):
        """Test that doctor sees only visits assigned to them."""
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=self.doctor_user)

        response = client.get('/api/ohc/visits/')
        self.assertEqual(response.status_code, 200)

        # Doctor should only see visit1 and visit3 (assigned to doctor1)
        # Handle paginated response
        results = response.data if hasattr(response.data, '__iter__') and not isinstance(response.data, dict) else []
        visit_ids = [visit['id'] for visit in results] if isinstance(results, list) else []
        self.assertIn(self.visit1.id, visit_ids)
        self.assertIn(self.visit3.id, visit_ids)
        self.assertNotIn(self.visit2.id, visit_ids)

    def test_admin_sees_all_visits(self):
        """Test that admin sees all visits."""
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=self.admin_user)

        response = client.get('/api/ohc/visits/')
        self.assertEqual(response.status_code, 200)

        results = response.data if hasattr(response.data, '__iter__') and not isinstance(response.data, dict) else []
        visit_ids = [visit['id'] for visit in results] if isinstance(results, list) else []
        self.assertIn(self.visit1.id, visit_ids)
        self.assertIn(self.visit2.id, visit_ids)
        self.assertIn(self.visit3.id, visit_ids)

    def test_ehs_sees_all_visits(self):
        """Test that EHS sees all visits."""
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=self.ehs_user)

        response = client.get('/api/ohc/visits/')
        self.assertEqual(response.status_code, 200)

        results = response.data if hasattr(response.data, '__iter__') and not isinstance(response.data, dict) else []
        visit_ids = [visit['id'] for visit in results] if isinstance(results, list) else []
        self.assertIn(self.visit1.id, visit_ids)
        self.assertIn(self.visit2.id, visit_ids)
        self.assertIn(self.visit3.id, visit_ids)

    def test_management_sees_all_visits(self):
        """Test that Management sees all visits."""
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=self.management_user)

        response = client.get('/api/ohc/visits/')
        self.assertEqual(response.status_code, 200)

        results = response.data if hasattr(response.data, '__iter__') and not isinstance(response.data, dict) else []
        visit_ids = [visit['id'] for visit in results] if isinstance(results, list) else []
        self.assertIn(self.visit1.id, visit_ids)
        self.assertIn(self.visit2.id, visit_ids)
        self.assertIn(self.visit3.id, visit_ids)

    def test_pharmacist_sees_in_progress_visits(self):
        """Test that pharmacist sees only IN_PROGRESS visits."""
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=self.pharmacist_user)

        response = client.get('/api/ohc/visits/')
        self.assertEqual(response.status_code, 200)

        results = response.data if hasattr(response.data, '__iter__') and not isinstance(response.data, dict) else []
        visit_ids = [visit['id'] for visit in results] if isinstance(results, list) else []
        self.assertIn(self.visit2.id, visit_ids)
        self.assertNotIn(self.visit1.id, visit_ids)
        self.assertNotIn(self.visit3.id, visit_ids)

    def test_medicine_stock_list(self):
        """Test listing medicine stock."""
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=self.admin_user)

        response = client.get('/api/ohc/medicines/')
        self.assertEqual(response.status_code, 200)

        results = response.data if hasattr(response.data, '__iter__') and not isinstance(response.data, dict) else []
        medicines = results if isinstance(results, list) else []
        self.assertEqual(len(medicines), 1)
        self.assertEqual(medicines[0]['medicine_id'], 'MED001')
        self.assertEqual(medicines[0]['name'], 'Paracetamol')

    def test_medicine_stock_create(self):
        """Test creating new medicine stock (pharmacist only)."""
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=self.pharmacist_user)

        data = {
            'medicine_id': 'MED002',
            'name': 'Ibuprofen',
            'unit': 'TABLETS',
            'stock_quantity': 50,
            'supplier': 'PharmaCorp',
            'batch_number': 'BATCH456',
            'expiry_date': '2028-06-30',
            'reorder_level': 10,
        }

        response = client.post('/api/ohc/medicines/', data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['medicine_id'], 'MED002')
        self.assertEqual(response.data['name'], 'Ibuprofen')

    def test_medicine_dispense_insufficient_stock(self):
        """Test dispensing fails when insufficient stock."""
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=self.pharmacist_user)

        data = {
            'visit_id': self.visit2.id,
            'prescription_id': self.prescription.id,
            'quantity_dispensed': 150,
            'issue_date': '2026-05-22',
            'remarks': 'Dispensing test',
        }

        response = client.post(f'/api/ohc/medicines/{self.medicine.id}/dispense/', data)
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.data)

    def test_medicine_dispense_success(self):
        """Test successful medicine dispensing."""
        from rest_framework.test import APIClient
        from datetime import date

        client = APIClient()
        client.force_authenticate(user=self.pharmacist_user)

        initial_stock = self.medicine.stock_quantity

        data = {
            'visit_id': self.visit2.id,
            'prescription_id': self.prescription.id,
            'quantity_dispensed': 5,
            'issue_date': date.today().isoformat(),
            'remarks': 'Dispensing test',
        }

        response = client.post(f'/api/ohc/medicines/{self.medicine.id}/dispense/', data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['quantity_dispensed'], 5)
        self.assertEqual(response.data['quantity_before'], initial_stock)
        self.assertEqual(response.data['quantity_remaining'], initial_stock - 5)

    def test_analytics_dashboard(self):
        """Test analytics dashboard endpoint."""
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=self.ehs_user)

        response = client.get('/api/ohc/analytics/')
        self.assertEqual(response.status_code, 200)

        data = response.data
        self.assertIn('summary', data)
        self.assertIn('department_wise', data)
        self.assertIn('severity_wise', data)
        self.assertEqual(data['summary']['total_visits'], 3)

    def test_analytics_dashboard_filters(self):
        """Test analytics dashboard with filters."""
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=self.ehs_user)

        response = client.get('/api/ohc/analytics/?status=OPEN')
        self.assertEqual(response.status_code, 200)

        data = response.data
        self.assertEqual(data['summary']['open_cases'], 1)  # Only visit1 is OPEN


class SerializerValidationTests(TestCase):
    """Test serializer validation logic."""

    def setUp(self):
        from datetime import date, timedelta
        from django.utils import timezone

        self.employee_user = User.objects.create_user(
            username='employee_serializer',
            email='employee_serializer@example.com',
            password='testpass123',
            role=User.Role.EMPLOYEE
        )
        self.employee_profile = EmployeeProfile.objects.create(
            user=self.employee_user,
            employee_code='EMP002',
            department='Manufacturing',
        )

        self.doctor_user = User.objects.create_user(
            username='doctor_serializer',
            email='doctor_serializer@example.com',
            password='testpass123',
            role=User.Role.DOCTOR
        )
        self.doctor_profile = DoctorProfile.objects.create(
            user=self.doctor_user,
            doctor_type=DoctorProfile.DoctorType.OHC,
            registration_number='DOC003',
            specialization='General Medicine'
        )

        self.visit = OHCVisit.objects.create(
            employee=self.employee_profile,
            consulted_doctor=self.doctor_profile,
            visit_status=OHCVisit.VisitStatus.OPEN,
            visit_date=timezone.now(),
        )

    def test_diagnosis_severity_validation(self):
        """Test diagnosis severity only accepts valid enum values."""
        from ohc.serializers import DiagnosisSerializer

        data = {
            'visit': self.visit.id,
            'diagnosed_by': self.doctor_profile.id,
            'diagnosis_name': 'Test Diagnosis',
            'severity': 'INVALID_SEVERITY',
        }

        serializer = DiagnosisSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('severity', serializer.errors)

    def test_diagnosis_fitness_decision_validation(self):
        """Test fitness decision only accepts valid enum values."""
        from ohc.serializers import DiagnosisSerializer

        data = {
            'visit': self.visit.id,
            'diagnosed_by': self.doctor_profile.id,
            'diagnosis_name': 'Test Diagnosis',
            'fitness_decision': 'INVALID_DECISION',
        }

        serializer = DiagnosisSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('fitness_decision', serializer.errors)

    def test_prescription_duration_validation(self):
        """Test prescription duration must be positive."""
        from ohc.serializers import PrescriptionSerializer
        from datetime import date

        data = {
            'visit': self.visit.id,
            'prescribed_by': self.doctor_profile.id,
            'medicine_name': 'Paracetamol',
            'dosage': '500mg',
            'frequency': 'Three times daily',
            'duration_days': -1,  # Invalid: must be positive
            'start_date': date.today(),
        }

        serializer = PrescriptionSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('duration_days', serializer.errors)

    def test_medicine_stock_unique_medicine_id(self):
        """Test medicine_id must be unique."""
        from datetime import date, timedelta
        from ohc.serializers import MedicineStockSerializer

        # Create first medicine
        MedicineStock.objects.create(
            medicine_id='MED_UNIQUE',
            name='Paracetamol',
            unit=MedicineStock.Unit.TABLETS,
            stock_quantity=100,
            initial_stock=200,
        )

        # Try to create duplicate
        data = {
            'medicine_id': 'MED_UNIQUE',  # Duplicate
            'name': 'Different Name',
            'unit': 'TABLETS',
            'stock_quantity': 50,
            'initial_stock': 50,
        }

        serializer = MedicineStockSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('medicine_id', serializer.errors)


class PermissionEdgeCaseTests(TestCase):
    """Test permission class edge cases."""

    def test_is_pharmacist_with_superuser(self):
        """Test superuser passes IsPharmacist permission."""
        from accounts.permissions import IsPharmacist
        from rest_framework.test import APIRequestFactory

        user = User.objects.create_superuser(
            username='admin_perm',
            email='admin_perm@example.com',
            password='testpass123'
        )

        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = user

        permission = IsPharmacist()
        self.assertTrue(permission.has_permission(request, None))

    def test_is_pharmacist_with_pharmacist_role(self):
        """Test PHARMACIST role passes IsPharmacist permission."""
        from accounts.permissions import IsPharmacist
        from rest_framework.test import APIRequestFactory

        user = User.objects.create_user(
            username='pharmacist_perm',
            email='pharmacist_perm@example.com',
            password='testpass123',
            role=User.Role.PHARMACIST
        )

        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = user

        permission = IsPharmacist()
        self.assertTrue(permission.has_permission(request, None))

    def test_is_pharmacist_with_doctor_role_fails(self):
        """Test DOCTOR role fails IsPharmacist permission."""
        from accounts.permissions import IsPharmacist
        from rest_framework.test import APIRequestFactory

        user = User.objects.create_user(
            username='doctor_perm',
            email='doctor_perm@example.com',
            password='testpass123',
            role=User.Role.DOCTOR
        )

        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = user

        permission = IsPharmacist()
        self.assertFalse(permission.has_permission(request, None))

    def test_is_management_with_management_role(self):
        """Test MANAGEMENT role passes IsManagement permission."""
        from accounts.permissions import IsManagement
        from rest_framework.test import APIRequestFactory

        user = User.objects.create_user(
            username='manager_perm',
            email='manager_perm@example.com',
            password='testpass123',
            role=User.Role.MANAGEMENT
        )

        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = user

        permission = IsManagement()
        self.assertTrue(permission.has_permission(request, None))

    def test_is_management_with_ehs_role_fails(self):
        """Test EHS role fails IsManagement permission."""
        from accounts.permissions import IsManagement
        from rest_framework.test import APIRequestFactory

        user = User.objects.create_user(
            username='ehs_perm',
            email='ehs_perm@example.com',
            password='testpass123',
            role=User.Role.EHS
        )

        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = user

        permission = IsManagement()
        self.assertFalse(permission.has_permission(request, None))

    def test_is_ehs_or_management_with_ehs_role(self):
        """Test EHS role passes IsEHSOrManagement permission."""
        from accounts.permissions import IsEHSOrManagement
        from rest_framework.test import APIRequestFactory

        user = User.objects.create_user(
            username='ehs_perm2',
            email='ehs_perm2@example.com',
            password='testpass123',
            role=User.Role.EHS
        )

        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = user

        permission = IsEHSOrManagement()
        self.assertTrue(permission.has_permission(request, None))

    def test_has_health_portal_access_unauthenticated_fails(self):
        """Test unauthenticated user fails HasHealthPortalAccess."""
        from accounts.permissions import HasHealthPortalAccess
        from rest_framework.test import APIRequestFactory

        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = None  # Unauthenticated

        permission = HasHealthPortalAccess()
        self.assertFalse(permission.has_permission(request, None))

    def test_has_health_portal_access_with_superuser(self):
        """Test superuser passes HasHealthPortalAccess."""
        from accounts.permissions import HasHealthPortalAccess
        from rest_framework.test import APIRequestFactory

        user = User.objects.create_superuser(
            username='admin_perm2',
            email='admin_perm2@example.com',
            password='testpass123'
        )

        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = user

        permission = HasHealthPortalAccess()
        self.assertTrue(permission.has_permission(request, None))


class AdditionalSerializerTests(TestCase):
    """Additional serializer tests for coverage."""

    def setUp(self):
        from datetime import date, timedelta
        from django.utils import timezone

        self.employee_user = User.objects.create_user(
            username='employee_additional',
            email='employee_additional@example.com',
            password='testpass123',
            role=User.Role.EMPLOYEE
        )
        self.employee_profile = EmployeeProfile.objects.create(
            user=self.employee_user,
            employee_code='EMP004',
            department='Manufacturing',
        )

        self.doctor_user = User.objects.create_user(
            username='doctor_additional',
            email='doctor_additional@example.com',
            password='testpass123',
            role=User.Role.DOCTOR
        )
        self.doctor_profile = DoctorProfile.objects.create(
            user=self.doctor_user,
            doctor_type=DoctorProfile.DoctorType.OHC,
            registration_number='DOC005',
            specialization='General Medicine'
        )

        self.visit = OHCVisit.objects.create(
            employee=self.employee_profile,
            consulted_doctor=self.doctor_profile,
            visit_status=OHCVisit.VisitStatus.OPEN,
            visit_date=timezone.now(),
        )

    def test_follow_up_schedule_serializer(self):
        """Test FollowUpScheduleSerializer."""
        from ohc.serializers import FollowUpScheduleSerializer
        from datetime import date, timedelta

        future_date = date.today() + timedelta(days=7)

        serializer = FollowUpScheduleSerializer(data={
            'follow_up_date': future_date.isoformat(),
            'next_action': 'Follow-up check',
        }, context={
            'visit': self.visit,
            'request': type('Request', (), {})  # Mock request
        })

        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['follow_up_date'], future_date)
        self.assertEqual(serializer.validated_data['next_action'], 'Follow-up check')

    def test_follow_up_schedule_with_future_date(self):
        """Test follow-up date can be future."""
        from ohc.serializers import FollowUpScheduleSerializer
        from datetime import date, timedelta

        future_date = date.today() + timedelta(days=30)

        serializer = FollowUpScheduleSerializer(data={
            'follow_up_date': future_date.isoformat(),
        }, context={
            'visit': self.visit,
            'request': type('Request', (), {}),
        })

        self.assertTrue(serializer.is_valid())

    def test_medical_test_serializer(self):
        """Test MedicalTestSerializer."""
        from ohc.serializers import MedicalTestSerializer

        serializer = MedicalTestSerializer(data={
            'visit': self.visit.id,
            'requested_by': self.doctor_profile.id,
            'test_name': 'Blood Test',
            'test_type': 'Laboratory',
            'priority': 'ROUTINE',
        })

        self.assertTrue(serializer.is_valid())

    def test_medical_test_status_validation(self):
        """Test medical test status enum validation."""
        from ohc.serializers import MedicalTestSerializer

        serializer = MedicalTestSerializer(data={
            'visit': self.visit.id,
            'requested_by': self.doctor_profile.id,
            'test_name': 'Blood Test',
            'test_type': 'Laboratory',
            'priority': 'ROUTINE',
            'status': 'INVALID_STATUS',
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn('status', serializer.errors)

    def test_medical_test_priority_validation(self):
        """Test medical test priority enum validation."""
        from ohc.serializers import MedicalTestSerializer

        serializer = MedicalTestSerializer(data={
            'visit': self.visit.id,
            'requested_by': self.doctor_profile.id,
            'test_name': 'Blood Test',
            'test_type': 'Laboratory',
            'priority': 'INVALID_PRIORITY',
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn('priority', serializer.errors)

    def test_ohc_visit_status_enum_validation(self):
        """Test OHCVisit status enum validation."""
        from ohc.serializers import OHCVisitSerializer

        serializer = OHCVisitSerializer(data={
            'employee': self.employee_profile.id,
            'consulted_doctor': self.doctor_profile.id,
            'visit_type': 'WALK_IN',
            'visit_status': 'INVALID_STATUS',
            'visit_date': '2026-05-22T10:00:00Z',
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn('visit_status', serializer.errors)

    def test_ohc_visit_triage_enum_validation(self):
        """Test OHCVisit triage level enum validation."""
        from ohc.serializers import OHCVisitSerializer

        serializer = OHCVisitSerializer(data={
            'employee': self.employee_profile.id,
            'consulted_doctor': self.doctor_profile.id,
            'visit_type': 'WALK_IN',
            'visit_status': 'OPEN',
            'triage_level': 'INVALID_TRIAGE',
            'visit_date': '2026-05-22T10:00:00Z',
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn('triage_level', serializer.errors)

    def test_ohc_visit_type_enum_validation(self):
        """Test OHCVisit type enum validation."""
        from ohc.serializers import OHCVisitSerializer

        serializer = OHCVisitSerializer(data={
            'employee': self.employee_profile.id,
            'consulted_doctor': self.doctor_profile.id,
            'visit_type': 'INVALID_TYPE',
            'visit_status': 'OPEN',
            'visit_date': '2026-05-22T10:00:00Z',
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn('visit_type', serializer.errors)

    def test_medicine_stock_unit_enum_validation(self):
        """Test MedicineStock unit enum validation."""
        from datetime import date, timedelta
        from ohc.serializers import MedicineStockSerializer

        serializer = MedicineStockSerializer(data={
            'medicine_id': 'MED001',
            'name': 'Paracetamol',
            'unit': 'INVALID_UNIT',
            'stock_quantity': 100,
            'initial_stock': 100,
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn('unit', serializer.errors)

    def test_prescription_status_enum_validation(self):
        """Test Prescription status enum validation."""
        from ohc.serializers import PrescriptionSerializer
        from datetime import date

        serializer = PrescriptionSerializer(data={
            'visit': self.visit.id,
            'prescribed_by': self.doctor_profile.id,
            'medicine_name': 'Paracetamol',
            'dosage': '500mg',
            'frequency': 'Three times daily',
            'duration_days': 7,
            'start_date': date.today(),
            'status': 'INVALID_STATUS',
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn('status', serializer.errors)

    def test_prescription_requires_medicine_name(self):
        """Test prescription requires medicine_name."""
        from ohc.serializers import PrescriptionSerializer
        from datetime import date

        serializer = PrescriptionSerializer(data={
            'visit': self.visit.id,
            'prescribed_by': self.doctor_profile.id,
            'medicine_name': '',  # Empty string should fail
            'dosage': '500mg',
            'frequency': 'Three times daily',
            'duration_days': 7,
            'start_date': date.today(),
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn('medicine_name', serializer.errors)

    def test_prescription_requires_dosage(self):
        """Test prescription requires dosage."""
        from ohc.serializers import PrescriptionSerializer
        from datetime import date

        serializer = PrescriptionSerializer(data={
            'visit': self.visit.id,
            'prescribed_by': self.doctor_profile.id,
            'medicine_name': 'Paracetamol',
            'dosage': '',  # Empty string should fail
            'frequency': 'Three times daily',
            'duration_days': 7,
            'start_date': date.today(),
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn('dosage', serializer.errors)

    def test_prescription_requires_frequency(self):
        """Test prescription requires frequency."""
        from ohc.serializers import PrescriptionSerializer
        from datetime import date

        serializer = PrescriptionSerializer(data={
            'visit': self.visit.id,
            'prescribed_by': self.doctor_profile.id,
            'medicine_name': 'Paracetamol',
            'dosage': '500mg',
            'frequency': '',  # Empty string should fail
            'duration_days': 7,
            'start_date': date.today(),
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn('frequency', serializer.errors)

    def test_prescription_requires_start_date(self):
        """Test prescription requires start_date."""
        from ohc.serializers import PrescriptionSerializer

        serializer = PrescriptionSerializer(data={
            'visit': self.visit.id,
            'prescribed_by': self.doctor_profile.id,
            'medicine_name': 'Paracetamol',
            'dosage': '500mg',
            'frequency': 'Three times daily',
            'duration_days': 7,
            'start_date': None,  # Missing start_date
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn('start_date', serializer.errors)

    def test_medicine_dispense_status_enum_validation(self):
        """Test MedicineDispense status enum validation."""
        from ohc.serializers import MedicineDispenseSerializer
        from datetime import date

        serializer = MedicineDispenseSerializer(data={
            'medicine': None,
            'visit': self.visit.id,
            'quantity_dispensed': 5,
            'quantity_remaining': 95,
            'issue_date': date.today(),
            'status': 'INVALID_STATUS',
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn('status', serializer.errors)


class VisitStatusLogTests(TestCase):
    """Test VisitStatusLog model."""

    def setUp(self):
        from django.utils import timezone

        self.employee_user = User.objects.create_user(
            username='employee_log',
            email='employee_log@example.com',
            password='testpass123',
            role=User.Role.EMPLOYEE
        )
        self.employee_profile = EmployeeProfile.objects.create(
            user=self.employee_user,
            employee_code='EMP005',
            department='Manufacturing',
        )

        self.doctor_user = User.objects.create_user(
            username='doctor_log',
            email='doctor_log@example.com',
            password='testpass123',
            role=User.Role.DOCTOR
        )
        self.doctor_profile = DoctorProfile.objects.create(
            user=self.doctor_user,
            doctor_type=DoctorProfile.DoctorType.OHC,
            registration_number='DOC006',
            specialization='General Medicine'
        )

        self.visit = OHCVisit.objects.create(
            employee=self.employee_profile,
            consulted_doctor=self.doctor_profile,
            visit_status=OHCVisit.VisitStatus.OPEN,
            visit_date=timezone.now(),
        )

    def test_status_log_creation(self):
        """Test visit status log is created correctly."""
        from ohc.models import VisitStatusLog

        log = VisitStatusLog.objects.create(
            visit=self.visit,
            from_status='',
            to_status=OHCVisit.VisitStatus.OPEN,
            changed_by=self.doctor_user,
            notes='Initial visit',
        )

        self.assertEqual(log.visit, self.visit)
        self.assertEqual(log.to_status, OHCVisit.VisitStatus.OPEN)
        self.assertEqual(log.changed_by, self.doctor_user)
        self.assertEqual(log.notes, 'Initial visit')

    def test_status_log_transition(self):
        """Test status transition logging."""
        from ohc.models import VisitStatusLog

        log1 = VisitStatusLog.objects.create(
            visit=self.visit,
            from_status='',
            to_status=OHCVisit.VisitStatus.OPEN,
            changed_by=self.doctor_user,
            notes='Initial',
        )

        self.visit.visit_status = OHCVisit.VisitStatus.IN_PROGRESS
        self.visit.save()

        log2 = VisitStatusLog.objects.create(
            visit=self.visit,
            from_status=OHCVisit.VisitStatus.OPEN,
            to_status=OHCVisit.VisitStatus.IN_PROGRESS,
            changed_by=self.doctor_user,
            notes='Diagnosis added',
        )

        self.assertEqual(self.visit.status_logs.count(), 2)
        self.assertEqual(log2.from_status, OHCVisit.VisitStatus.OPEN)
        self.assertEqual(log2.to_status, OHCVisit.VisitStatus.IN_PROGRESS)


class PropertyEdgeCaseTests(TestCase):
    """Test model property edge cases."""

    def test_medicine_stock_zero_reorder_level(self):
        """Test is_low_stock when reorder_level is 0."""
        MedicineStock.objects.create(
            medicine_id='MED_ZERO',
            name='Test Medicine',
            unit=MedicineStock.Unit.TABLETS,
            stock_quantity=0,
            initial_stock=0,
            reorder_level=0,  # Zero reorder level
        )

        medicine = MedicineStock.objects.get(medicine_id='MED_ZERO')
        self.assertFalse(medicine.is_low_stock)  # Stock >= 0 should not be low

    def test_medicine_stock_negative_stock(self):
        """Test negative stock doesn't cause errors."""
        MedicineStock.objects.create(
            medicine_id='MED_NEG',
            name='Test Medicine',
            unit=MedicineStock.Unit.TABLETS,
            stock_quantity=-5,
            initial_stock=0,
            reorder_level=10,
        )

        medicine = MedicineStock.objects.get(medicine_id='MED_NEG')
        self.assertTrue(medicine.is_low_stock)

    def test_medicine_expiry_none_date(self):
        """Test medicine with no expiry date is not expired."""
        medicine = MedicineStock.objects.create(
            medicine_id='MED_NO_EXPIRY',
            name='Test Medicine',
            unit=MedicineStock.Unit.TABLETS,
            stock_quantity=50,
            initial_stock=50,
            expiry_date=None,  # No expiry date
        )

        self.assertFalse(medicine.is_expired)
        self.assertFalse(medicine.is_expiring_soon)

    def test_diagnosis_condition_status_validation(self):
        """Test condition status enum values."""
        valid_statuses = [
            Diagnosis.ConditionStatus.ACTIVE,
            Diagnosis.ConditionStatus.STABLE,
            Diagnosis.ConditionStatus.RESOLVED,
            Diagnosis.ConditionStatus.CHRONIC,
        ]

        for status in valid_statuses:
            diagnosis = Diagnosis.objects.create(
                visit=self.visit,
                diagnosed_by=self.doctor_profile,
                diagnosis_name='Test',
                condition_status=status,
            )
            self.assertEqual(diagnosis.condition_status, status)

    def test_medical_test_priority_validation(self):
        """Test medical test priority enum values."""
        valid_priorities = [
            MedicalTest.Priority.ROUTINE,
            MedicalTest.Priority.URGENT,
            MedicalTest.Priority.STAT,
        ]

        for priority in valid_priorities:
            test = MedicalTest.objects.create(
                visit=self.visit,
                requested_by=self.doctor_profile,
                test_name='Test',
                test_type='Laboratory',
                priority=priority,
            )
            self.assertEqual(test.priority, priority)

    def test_medical_test_status_validation(self):
        """Test medical test status enum values."""
        valid_statuses = [
            MedicalTest.TestStatus.ORDERED,
            MedicalTest.TestStatus.SAMPLE_COLLECTED,
            MedicalTest.TestStatus.IN_PROGRESS,
            MedicalTest.TestStatus.COMPLETED,
            MedicalTest.TestStatus.CANCELLED,
        ]

        for status in valid_statuses:
            test = MedicalTest.objects.create(
                visit=self.visit,
                requested_by=self.doctor_profile,
                test_name='Test',
                test_type='Laboratory',
                status=status,
            )
            self.assertEqual(test.status, status)