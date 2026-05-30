"""
Script to create large dummy data for testing the OHC workflow:
Nurse -> Doctor -> Pharmacist -> EHS/Management reports

Examples:
  python create_dummy_data.py
  python create_dummy_data.py --records 1500 --employees 320
"""

import argparse
import os
import random
from datetime import timedelta

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myproject.settings")
django.setup()

from django.db import transaction
from django.utils import timezone

from accounts.models import DoctorProfile, EmployeeProfile, User
from ahc.models import Hospital, Referral
from ohc.models import Diagnosis, MedicineDispense, MedicineStock, OHCVisit, Prescription


DEPARTMENTS = [
    "Engineering",
    "Manufacturing",
    "Quality",
    "Safety",
    "Operations",
    "HR",
    "Finance",
    "Administration",
    "Maintenance",
    "Logistics",
]

DESIGNATIONS = [
    "Operator",
    "Engineer",
    "Supervisor",
    "Executive",
    "Manager",
    "Technician",
    "Coordinator",
]

COMPLAINTS = [
    ("Fever and body pain", "fever, headache, weakness"),
    ("Back pain", "lower back pain after long shift"),
    ("Cough and cold", "cough, throat irritation, sneezing"),
    ("Headache", "persistent headache and eye strain"),
    ("Minor cut injury", "cut on hand while operating equipment"),
    ("Stomach upset", "acidity, nausea, stomach discomfort"),
    ("Dizziness", "lightheadedness and fatigue"),
    ("Knee pain", "pain while walking and climbing stairs"),
    ("Chest discomfort", "mild chest pain and breathing discomfort"),
    ("Skin irritation", "itching and redness on forearm"),
]

DIAGNOSES = [
    "Viral Fever",
    "Muscle Strain",
    "Upper Respiratory Infection",
    "Migraine",
    "Minor Laceration",
    "Gastritis",
    "Fatigue",
    "Joint Pain",
    "Observation Required",
    "Dermatitis",
]

MEDICINE_CATALOG = [
    {
        "medicine_id": "MED001",
        "name": "Paracetamol",
        "unit": "Tablet",
        "stock_quantity": 4000,
        "initial_stock": 4000,
        "supplier": "PharmaCorp",
        "batch_number": "B001",
        "reorder_level": 200,
    },
    {
        "medicine_id": "MED002",
        "name": "Amoxicillin",
        "unit": "Capsule",
        "stock_quantity": 2400,
        "initial_stock": 2400,
        "supplier": "MediHealth",
        "batch_number": "B002",
        "reorder_level": 150,
    },
    {
        "medicine_id": "MED003",
        "name": "Ibuprofen",
        "unit": "Tablet",
        "stock_quantity": 3000,
        "initial_stock": 3000,
        "supplier": "PharmaCorp",
        "batch_number": "B003",
        "reorder_level": 180,
    },
    {
        "medicine_id": "MED004",
        "name": "Cetirizine",
        "unit": "Tablet",
        "stock_quantity": 1800,
        "initial_stock": 1800,
        "supplier": "LifeCare",
        "batch_number": "B004",
        "reorder_level": 120,
    },
    {
        "medicine_id": "MED005",
        "name": "Pantoprazole",
        "unit": "Tablet",
        "stock_quantity": 2200,
        "initial_stock": 2200,
        "supplier": "HealthPlus",
        "batch_number": "B005",
        "reorder_level": 140,
    },
]

HOSPITALS = [
    {
        "code": "HSP001",
        "name": "City Care Hospital",
        "address_line_1": "101 Main Road",
        "city": "Pune",
        "state": "Maharashtra",
        "specialties": ["General Medicine", "Orthopedics"],
    },
    {
        "code": "HSP002",
        "name": "Sunrise Multispeciality",
        "address_line_1": "22 Lake View",
        "city": "Pune",
        "state": "Maharashtra",
        "specialties": ["Cardiology", "Pulmonology"],
    },
    {
        "code": "HSP003",
        "name": "Metro Health Center",
        "address_line_1": "78 Industrial Belt",
        "city": "Mumbai",
        "state": "Maharashtra",
        "specialties": ["Emergency", "Trauma"],
    },
]


def parse_args():
    parser = argparse.ArgumentParser(description="Create bulk dummy OHC data.")
    parser.add_argument("--records", type=int, default=1500, help="Number of dummy visits to create.")
    parser.add_argument("--employees", type=int, default=320, help="Number of dummy employees to create.")
    return parser.parse_args()


def ensure_doctor_profile():
    try:
        return DoctorProfile.objects.get(user__username="doctor_test")
    except DoctorProfile.DoesNotExist:
        raise RuntimeError("doctor_test profile not found. Please seed test users first.")


def ensure_pharmacist_user():
    return User.objects.filter(username="pharmacist_test").first()


def ensure_medicines():
    medicines = []
    for med_data in MEDICINE_CATALOG:
        medicine, _ = MedicineStock.objects.get_or_create(
            medicine_id=med_data["medicine_id"],
            defaults=med_data,
        )
        medicines.append(medicine)
    return medicines


def ensure_hospitals():
    hospitals = []
    for hospital_data in HOSPITALS:
        hospital, _ = Hospital.objects.get_or_create(
            code=hospital_data["code"],
            defaults={
                **hospital_data,
                "hospital_status": Hospital.HospitalStatus.ACTIVE,
                "supports_cashless": True,
                "is_available_for_video": False,
            },
        )
        hospitals.append(hospital)
    return hospitals


def ensure_employees(total_employees):
    employees = []

    for index in range(1, total_employees + 1):
        employee_code = f"DUMMY-EMP-{index:04d}"
        username = f"dummy_emp_{index:04d}"

        user, user_created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": f"{username}@example.com",
                "first_name": f"Emp{index:04d}",
                "last_name": random.choice(["Patil", "Sharma", "Khan", "Iyer", "Das", "Joshi"]),
                "role": User.Role.EMPLOYEE,
                "is_verified": True,
                "phone_number": f"98{index:08d}"[-10:],
            },
        )
        if user_created:
            user.set_password("Test@12345")
            user.save(update_fields=["password"])

        employee, _ = EmployeeProfile.objects.get_or_create(
            user=user,
            defaults={
                "employee_code": employee_code,
                "department": random.choice(DEPARTMENTS),
                "designation": random.choice(DESIGNATIONS),
                "gender": random.choice(["MALE", "FEMALE"]),
            },
        )

        if not employee.employee_code:
            employee.employee_code = employee_code
            employee.save(update_fields=["employee_code"])

        employees.append(employee)

    return employees


def pick_visit_type(index):
    if index % 15 == 0:
        return OHCVisit.VisitType.PRE_EMPLOYMENT
    if index % 10 == 0:
        return OHCVisit.VisitType.PERIODIC
    if index % 9 == 0:
        return OHCVisit.VisitType.EMERGENCY
    if index % 6 == 0:
        return OHCVisit.VisitType.FOLLOW_UP
    return OHCVisit.VisitType.WALK_IN


def pick_triage(visit_type, complaint):
    complaint_lower = complaint.lower()
    if visit_type == OHCVisit.VisitType.EMERGENCY or "chest" in complaint_lower:
        return random.choice([OHCVisit.TriageLevel.HIGH, OHCVisit.TriageLevel.CRITICAL])
    if "injury" in complaint_lower or "cut" in complaint_lower:
        return random.choice([OHCVisit.TriageLevel.MEDIUM, OHCVisit.TriageLevel.HIGH])
    return random.choice([OHCVisit.TriageLevel.LOW, OHCVisit.TriageLevel.MEDIUM])


def pick_fitness_decision(visit_type, triage_level):
    if visit_type == OHCVisit.VisitType.PRE_EMPLOYMENT:
        return random.choices(
            [
                Diagnosis.FitnessDecision.FIT,
                Diagnosis.FitnessDecision.FIT_WITH_RESTRICTION,
                Diagnosis.FitnessDecision.TEMPORARY_UNFIT,
                Diagnosis.FitnessDecision.UNFIT,
            ],
            weights=[70, 15, 10, 5],
            k=1,
        )[0]

    if triage_level == OHCVisit.TriageLevel.CRITICAL:
        return Diagnosis.FitnessDecision.TEMPORARY_UNFIT
    if triage_level == OHCVisit.TriageLevel.HIGH:
        return random.choice(
            [Diagnosis.FitnessDecision.FIT_WITH_RESTRICTION, Diagnosis.FitnessDecision.TEMPORARY_UNFIT]
        )
    return Diagnosis.FitnessDecision.FIT


@transaction.atomic
def create_dummy_data(total_records=1500, total_employees=320):
    print("=" * 60)
    print("Creating Bulk Dummy Data for OHC Workflow")
    print("=" * 60)
    print(f"Target visits: {total_records}")
    print(f"Target employees: {total_employees}")

    doctor_profile = ensure_doctor_profile()
    pharmacist_user = ensure_pharmacist_user()
    medicines = ensure_medicines()
    hospitals = ensure_hospitals()
    employees = ensure_employees(total_employees)

    created_visits = 0
    created_diagnoses = 0
    created_prescriptions = 0
    created_referrals = 0
    created_dispenses = 0

    today = timezone.now()

    print("\nCreating visits, diagnoses, prescriptions, and referrals...")

    for index in range(1, total_records + 1):
        employee = random.choice(employees)
        complaint, symptoms = random.choice(COMPLAINTS)
        diagnosis_name = random.choice(DIAGNOSES)
        visit_type = pick_visit_type(index)
        visit_date = (today - timedelta(days=random.randint(0, 365))).date()
        visit_time = (today - timedelta(minutes=random.randint(0, 720))).time().replace(microsecond=0)
        triage_level = pick_triage(visit_type, complaint)
        fitness_decision = pick_fitness_decision(visit_type, triage_level)
        severity = (
            Diagnosis.Severity.CRITICAL
            if triage_level == OHCVisit.TriageLevel.CRITICAL
            else Diagnosis.Severity.SERIOUS
            if triage_level == OHCVisit.TriageLevel.HIGH
            else Diagnosis.Severity.MODERATE
            if triage_level == OHCVisit.TriageLevel.MEDIUM
            else Diagnosis.Severity.MILD
        )
        requires_referral = triage_level in {OHCVisit.TriageLevel.HIGH, OHCVisit.TriageLevel.CRITICAL} or index % 8 == 0

        visit = OHCVisit.objects.create(
            employee=employee,
            consulted_doctor=doctor_profile,
            visit_type=visit_type,
            visit_status=(
                OHCVisit.VisitStatus.REFERRED
                if requires_referral
                else random.choice(
                    [
                        OHCVisit.VisitStatus.OPEN,
                        OHCVisit.VisitStatus.IN_PROGRESS,
                        OHCVisit.VisitStatus.COMPLETED,
                    ]
                )
            ),
            triage_level=triage_level,
            visit_date=visit_date,
            visit_time=visit_time,
            patient_name=f"{employee.user.first_name} {employee.user.last_name}",
            patient_age=random.randint(20, 58),
            patient_gender=employee.gender or random.choice(["MALE", "FEMALE"]),
            patient_contact=employee.user.phone_number or "9876543210",
            chief_complaint=complaint,
            symptoms=symptoms,
            preliminary_notes=f"Auto-generated dummy visit #{index}",
            requires_referral=requires_referral,
            follow_up_date=(visit_date + timedelta(days=7)) if index % 5 == 0 else None,
            next_action="FOLLOW_UP" if index % 5 == 0 else ("REFER_TO_AHC" if requires_referral else ""),
            vitals={
                "temperature": f"{98 + random.randint(0, 3)}.{random.randint(0, 9)}",
                "blood_pressure": f"{110 + random.randint(0, 25)}/{70 + random.randint(0, 18)}",
                "pulse": str(70 + random.randint(0, 25)),
                "spo2": str(95 + random.randint(0, 4)),
                "weight": str(52 + random.randint(0, 28)),
                "height": str(150 + random.randint(0, 25)),
            },
        )
        created_visits += 1

        diagnosis = Diagnosis.objects.create(
            visit=visit,
            diagnosed_by=doctor_profile,
            diagnosis_code=f"DX-{index:05d}",
            diagnosis_name=diagnosis_name,
            diagnosis_notes=f"Auto-generated diagnosis for {complaint.lower()}",
            severity=severity,
            fitness_decision=fitness_decision,
            is_primary=True,
            is_referral_required=requires_referral,
            follow_up_date=visit.follow_up_date,
            advised_rest_days=random.choice([0, 2, 3, 5]) if fitness_decision != Diagnosis.FitnessDecision.FIT else 0,
            work_restrictions="" if fitness_decision == Diagnosis.FitnessDecision.FIT else "Restricted duty",
        )
        created_diagnoses += 1

        prescription_count = 1 if visit_type == OHCVisit.VisitType.PRE_EMPLOYMENT else random.randint(1, 2)
        selected_medicines = random.sample(medicines, k=min(prescription_count, len(medicines)))

        for medicine in selected_medicines:
            prescription = Prescription.objects.create(
                visit=visit,
                diagnosis=diagnosis,
                prescribed_by=doctor_profile,
                medicine_name=medicine.name,
                dosage=random.choice(["250mg", "400mg", "500mg", "1 tablet"]),
                frequency=random.choice(["Once daily", "Twice daily", "Three times daily"]),
                duration_days=random.randint(3, 7),
                instructions=random.choice(["Take after meals", "Take with water", "Use as directed"]),
                start_date=visit_date,
                status=Prescription.PrescriptionStatus.ACTIVE,
            )
            created_prescriptions += 1

            if pharmacist_user and visit.visit_status == OHCVisit.VisitStatus.COMPLETED:
                quantity_dispensed = random.randint(4, 12)
                MedicineDispense.objects.create(
                    medicine=medicine,
                    visit=visit,
                    prescription=prescription,
                    dispensed_by=pharmacist_user,
                    quantity_dispensed=quantity_dispensed,
                    quantity_remaining=max(medicine.stock_quantity - quantity_dispensed, 0),
                    issue_date=visit_date,
                    remarks="Auto-generated dispense entry",
                )
                medicine.used_quantity += quantity_dispensed
                medicine.stock_quantity = max(medicine.stock_quantity - quantity_dispensed, 0)
                medicine.last_dispensed_at = timezone.now()
                medicine.save(update_fields=["used_quantity", "stock_quantity", "last_dispensed_at", "updated_at"])
                created_dispenses += 1

        if requires_referral:
            Referral.objects.create(
                visit=visit,
                diagnosis=diagnosis,
                employee=employee,
                referred_by=doctor_profile,
                hospital=random.choice(hospitals),
                referral_reason=diagnosis.diagnosis_notes,
                specialist_department=diagnosis_name,
                priority=(
                    Referral.ReferralPriority.EMERGENCY
                    if triage_level == OHCVisit.TriageLevel.CRITICAL
                    else Referral.ReferralPriority.URGENT
                ),
                referral_status=random.choice(
                    [
                        Referral.ReferralStatus.SENT,
                        Referral.ReferralStatus.ACCEPTED,
                        Referral.ReferralStatus.IN_TREATMENT,
                    ]
                ),
            )
            created_referrals += 1

        if index % 250 == 0:
            print(f"  Created {index} / {total_records} visits...")

    print("\n" + "=" * 60)
    print("Bulk Dummy Data Creation Complete")
    print("=" * 60)
    print(f"Employees available: {len(employees)}")
    print(f"Visits created: {created_visits}")
    print(f"Diagnoses created: {created_diagnoses}")
    print(f"Prescriptions created: {created_prescriptions}")
    print(f"Referrals created: {created_referrals}")
    print(f"Dispense records created: {created_dispenses}")
    print("\nTest Credentials:")
    print("  Nurse: nurse_test / Test@12345")
    print("  Doctor: doctor_test / Test@12345")
    print("  Pharmacist: pharmacist_test / Test@12345")
    print("  EHS: ehs_test / Test@12345")
    print("  Management: management_test / Test@12345")


if __name__ == "__main__":
    arguments = parse_args()
    create_dummy_data(total_records=arguments.records, total_employees=arguments.employees)
