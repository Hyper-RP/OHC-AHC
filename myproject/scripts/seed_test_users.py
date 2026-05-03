import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myproject.settings")

import django

django.setup()

from accounts.models import DoctorProfile, EmployeeProfile, User


PASSWORD = "Test@12345"


USERS = [
    {
        "username": "admin_test",
        "email": "admin_test@example.com",
        "first_name": "Admin",
        "last_name": "Tester",
        "role": User.Role.ADMIN,
        "is_staff": True,
        "is_superuser": True,
    },
    {
        "username": "nurse_test",
        "email": "nurse_test@example.com",
        "first_name": "Nurse",
        "last_name": "Tester",
        "role": User.Role.NURSE,
        "is_staff": True,
        "is_superuser": False,
        "registration_number": "NURSE-TEST-001",
        "specialization": "Occupational Nursing",
    },
    {
        "username": "hr_test",
        "email": "hr_test@example.com",
        "first_name": "HR",
        "last_name": "Tester",
        "role": User.Role.HR,
        "is_staff": True,
        "is_superuser": False,
    },
    {
        "username": "doctor_test",
        "email": "doctor_test@example.com",
        "first_name": "Doctor",
        "last_name": "Tester",
        "role": User.Role.DOCTOR,
        "is_staff": True,
        "is_superuser": False,
        "registration_number": "DOC-TEST-001",
        "specialization": "General Medicine",
    },
    {
        "username": "ehs_test",
        "email": "ehs_test@example.com",
        "first_name": "EHS",
        "last_name": "Tester",
        "role": User.Role.EHS,
        "is_staff": True,
        "is_superuser": False,
    },
    {
        "username": "kam_test",
        "email": "kam_test@example.com",
        "first_name": "KAM",
        "last_name": "Tester",
        "role": User.Role.KAM,
        "is_staff": True,
        "is_superuser": False,
    },
    {
        "username": "employee_test",
        "email": "employee_test@example.com",
        "first_name": "Employee",
        "last_name": "Tester",
        "role": User.Role.EMPLOYEE,
        "is_staff": False,
        "is_superuser": False,
    },
]


for data in USERS:
    user, _ = User.objects.get_or_create(username=data["username"])
    user.email = data["email"]
    user.first_name = data["first_name"]
    user.last_name = data["last_name"]
    user.role = data["role"]
    user.is_staff = data["is_staff"]
    user.is_superuser = data["is_superuser"]
    user.is_active = True
    user.set_password(PASSWORD)
    user.save()

    if user.role in {User.Role.DOCTOR, User.Role.NURSE}:
        DoctorProfile.objects.update_or_create(
            user=user,
            defaults={
                "doctor_type": DoctorProfile.DoctorType.OHC,
                "registration_number": data["registration_number"],
                "specialization": data["specialization"],
                "qualification": "MBBS",
                "years_of_experience": 5,
                "consultation_fee": 500,
                "is_active_doctor": True,
            },
        )

    if user.role == User.Role.EMPLOYEE:
        EmployeeProfile.objects.update_or_create(
            user=user,
            defaults={
                "employee_code": "EMP-TEST-001",
                "department": "Operations",
                "designation": "Machine Operator",
                "work_location": "Plant 1",
                "fitness_status": EmployeeProfile.FitnessStatus.FIT,
                "is_active_employee": True,
            },
        )

print("created_or_updated_test_users")
