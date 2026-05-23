"""
Script to create dummy data for testing the OHC workflow:
Nurse → Doctor → Pharmacist → EHS/Management reports
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
django.setup()

from django.utils import timezone
from datetime import datetime, timedelta

from accounts.models import User, EmployeeProfile, DoctorProfile
from ohc.models import OHCVisit, Diagnosis, Prescription, MedicineStock, MedicineDispense

def create_dummy_data():
    print("=" * 60)
    print("Creating Dummy Data for OHC Workflow")
    print("=" * 60)

    # Step 1: Create a test employee (for patient)
    print("\n1. Creating test employee...")
    try:
        employee_user = User.objects.get(username='john_doe')
        print(f"  Employee already exists: {employee_user.username}")
    except User.DoesNotExist:
        employee_user = User.objects.create_user(
            username='john_doe',
            email='john.doe@example.com',
            password='Test@12345',
            first_name='John',
            last_name='Doe',
            role=User.Role.EMPLOYEE,
            is_verified=True,
            phone_number='9876543210'
        )
        employee_profile = EmployeeProfile.objects.create(
            user=employee_user,
            employee_code='EMP-001',
            department='Engineering',
            designation='Software Engineer',
            gender='MALE'
        )
        print(f"  Created employee: {employee_user.first_name} {employee_user.last_name} ({employee_profile.employee_code})")

    # Step 2: Create some medicine stock
    print("\n2. Creating medicine stock...")
    medicines = [
        {
            'medicine_id': 'MED001',
            'name': 'Paracetamol',
            'unit': 'Tablet',
            'stock_quantity': 100,
            'initial_stock': 100,
            'supplier': 'PharmaCorp',
            'batch_number': 'B001',
            'reorder_level': 10
        },
        {
            'medicine_id': 'MED002',
            'name': 'Amoxicillin',
            'unit': 'Capsule',
            'stock_quantity': 50,
            'initial_stock': 50,
            'supplier': 'MediHealth',
            'batch_number': 'B002',
            'reorder_level': 15
        },
        {
            'medicine_id': 'MED003',
            'name': 'Ibuprofen',
            'unit': 'Tablet',
            'stock_quantity': 75,
            'initial_stock': 75,
            'supplier': 'PharmaCorp',
            'batch_number': 'B003',
            'reorder_level': 20
        },
    ]

    created_medicines = []
    for med_data in medicines:
        medicine, created = MedicineStock.objects.get_or_create(
            medicine_id=med_data['medicine_id'],
            defaults=med_data
        )
        if created:
            print(f"  Created: {medicine.name} (Stock: {medicine.stock_quantity} {medicine.unit})")
        else:
            print(f"  Exists: {medicine.name}")
        created_medicines.append(medicine)

    # Step 3: Get doctor and employee profiles
    print("\n3. Getting profiles...")
    try:
        doctor_profile = DoctorProfile.objects.get(user__username='doctor_test')
        print(f"  Doctor: {doctor_profile.user.first_name} {doctor_profile.user.last_name}")
    except DoctorProfile.DoesNotExist:
        print("  Error: doctor_test profile not found. Please ensure doctor_test exists.")
        return

    try:
        employee_profile = EmployeeProfile.objects.get(employee_code='EMP-001')
        print(f"  Employee: {employee_profile.user.first_name} {employee_profile.user.last_name}")
    except EmployeeProfile.DoesNotExist:
        employee_profile = EmployeeProfile.objects.filter(user__role=User.Role.EMPLOYEE).first()
        if not employee_profile:
            print("  Error: No employee profile found.")
            return
        print(f"  Employee: {employee_profile.user.first_name} {employee_profile.user.last_name}")

    # Step 4: Create an OPEN visit (simulating Nurse submission)
    print("\n4. Creating OPEN visit (Nurse submitted)...")
    visit, created = OHCVisit.objects.get_or_create(
        employee=employee_profile,
        consulted_doctor=doctor_profile,
        visit_date=timezone.now().date(),
        defaults={
            'visit_type': OHCVisit.VisitType.WALK_IN,
            'visit_status': OHCVisit.VisitStatus.OPEN,
            'triage_level': OHCVisit.TriageLevel.MEDIUM,
            'visit_time': timezone.now().time(),
            'patient_name': f'{employee_profile.user.first_name} {employee_profile.user.last_name}',
            'patient_age': 30,
            'patient_gender': 'MALE',
            'patient_contact': employee_profile.user.phone_number or '9876543210',
            'vitals': {
                'temperature': '99.2',
                'blood_pressure': '125/82',
                'pulse': '78',
                'spo2': '98',
                'weight': '70',
                'height': '172'
            }
        }
    )

    if created:
        print(f"  Created Visit ID: {visit.id}")
        print(f"  Status: {visit.visit_status}")
        print(f"  Assigned to: {visit.consulted_doctor.user.username}")
    else:
        print(f"  Visit already exists: {visit.id}")

    # Step 5: Create diagnosis with prescriptions (simulating Doctor submission)
    print("\n5. Creating diagnosis with prescriptions (Doctor submitted)...")
    diagnosis, created = Diagnosis.objects.get_or_create(
        visit=visit,
        diagnosed_by=doctor_profile,
        diagnosis_name='Upper Respiratory Tract Infection',
        defaults={
            'diagnosis_code': 'J06.9',
            'diagnosis_notes': 'Patient presents with symptoms of common cold. Vital signs are within normal range.',
            'severity': Diagnosis.Severity.MILD,
            'fitness_decision': Diagnosis.FitnessDecision.FIT,
            'is_primary': True,
            'is_referral_required': False,
            'follow_up_date': timezone.now().date() + timedelta(days=7)
        }
    )

    if created:
        print(f"  Created Diagnosis ID: {diagnosis.id}")
    else:
        print(f"  Diagnosis already exists: {diagnosis.id}")

    # Create prescriptions
    prescriptions_data = [
        {
            'medicine_name': 'Paracetamol',
            'dosage': '500mg',
            'frequency': 'Twice daily',
            'duration_days': 5,
            'instructions': 'Take after meals',
            'start_date': timezone.now().date(),
            'status': Prescription.PrescriptionStatus.ACTIVE
        },
        {
            'medicine_name': 'Ibuprofen',
            'dosage': '400mg',
            'frequency': 'Three times daily',
            'duration_days': 3,
            'instructions': 'Take with food',
            'start_date': timezone.now().date(),
            'status': Prescription.PrescriptionStatus.ACTIVE
        }
    ]

    created_prescriptions = []
    for presc_data in prescriptions_data:
        prescription, created = Prescription.objects.get_or_create(
            visit=visit,
            diagnosis=diagnosis,
            medicine_name=presc_data['medicine_name'],
            prescribed_by=doctor_profile,
            defaults=presc_data
        )
        if created:
            print(f"  Created Prescription: {prescription.medicine_name}")
        created_prescriptions.append(prescription)

    # Step 6: Update visit status (Doctor submitted to Pharmacist)
    visit.visit_status = OHCVisit.VisitStatus.IN_PROGRESS
    visit.save()
    print(f"  Visit status updated to: {visit.visit_status}")

    # Get pharmacist user for dispense record
    try:
        pharmacist_user = User.objects.get(username='pharmacist_test')
        print(f"  Pharmacist: {pharmacist_user.first_name} {pharmacist_user.last_name}")
    except User.DoesNotExist:
        print("  Warning: pharmacist_test user not found")
        pharmacist_user = None

    # Step 7: Simulate Pharmacist dispensing one medicine
    print("\n6. Simulating Pharmacist dispensing medicine...")
    paracetamol = created_medicines[0]  # Paracetamol
    first_prescription = created_prescriptions[0]  # Paracetamol prescription

    dispense_data = {
        'medicine': paracetamol,
        'visit': visit,
        'prescription': first_prescription,
        'dispensed_by': pharmacist_user,
        'quantity_dispensed': 10,  # 10 tablets (5 days * 2 per day)
        'quantity_remaining': paracetamol.stock_quantity - 10,
        'issue_date': timezone.now().date(),
        'remarks': 'Dispensed as per doctor prescription'
    }

    dispense, created = MedicineDispense.objects.get_or_create(
        visit=visit,
        prescription=first_prescription,
        medicine=paracetamol,
        defaults=dispense_data
    )

    if created:
        # Update medicine stock
        paracetamol.used_quantity += dispense.quantity_dispensed
        paracetamol.stock_quantity = paracetamol.initial_stock - paracetamol.used_quantity
        paracetamol.last_dispensed_at = timezone.now()
        paracetamol.save()
        print(f"  Dispensed: {paracetamol.name} ({dispense.quantity_dispensed} units)")
        print(f"  Stock updated: {paracetamol.stock_quantity} remaining")
    else:
        print(f"  Dispense record already exists")

    # Step 7: Update visit to COMPLETED (Pharmacist finished)
    visit.visit_status = OHCVisit.VisitStatus.COMPLETED
    visit.closed_at = timezone.now()
    visit.save()
    print(f"  Visit status updated to: {visit.visit_status}")

    print("\n" + "=" * 60)
    print("Dummy Data Creation Complete!")
    print("=" * 60)

    # Summary
    print("\nWorkflow Summary:")
    print(f"  Patient: {employee_profile.user.first_name} {employee_profile.user.last_name}")
    print(f"  Visit ID: {visit.id} (Status: {visit.visit_status})")
    print(f"  Doctor: {doctor_profile.user.first_name} {doctor_profile.user.last_name}")
    print(f"  Diagnosis: {diagnosis.diagnosis_name}")
    print(f"  Prescriptions: {len(created_prescriptions)} medicines")
    print(f"  Medicine Stock:")
    for med in created_medicines:
        print(f"    - {med.name}: {med.stock_quantity}/{med.initial_stock} {med.unit}")

    print("\n" + "=" * 60)
    print("Test Credentials:")
    print("=" * 60)
    print("  Nurse: nurse_test / Test@12345")
    print("  Doctor: doctor_test / Test@12345")
    print("  Pharmacist: pharmacist_test / Test@12345")
    print("  EHS: ehs_test / Test@12345")
    print("  Management: management_test / Test@12345")

if __name__ == '__main__':
    create_dummy_data()