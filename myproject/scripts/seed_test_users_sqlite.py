import base64
import hashlib
import secrets
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
DB_PATH = BASE_DIR / "db.sqlite3"
CREDENTIALS_PATH = BASE_DIR / "test_user_credentials.txt"
PASSWORD = "Test@12345"
ITERATIONS = 720000


def make_password(raw_password):
    salt = secrets.token_urlsafe(16)[:22]
    dk = hashlib.pbkdf2_hmac("sha256", raw_password.encode(), salt.encode(), ITERATIONS)
    hash_value = base64.b64encode(dk).decode().strip()
    return f"pbkdf2_sha256${ITERATIONS}${salt}${hash_value}"


def now_str():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S.%f")


USERS = [
    {
        "username": "admin_test",
        "email": "admin_test@example.com",
        "first_name": "Admin",
        "last_name": "Tester",
        "role": "ADMIN",
        "is_staff": 1,
        "is_superuser": 1,
        "profile": None,
    },
    {
        "username": "nurse_test",
        "email": "nurse_test@example.com",
        "first_name": "Nurse",
        "last_name": "Tester",
        "role": "NURSE",
        "is_staff": 1,
        "is_superuser": 0,
        "profile": "doctor",
        "registration_number": "NURSE-TEST-001",
        "specialization": "Occupational Nursing",
    },
    {
        "username": "hr_test",
        "email": "hr_test@example.com",
        "first_name": "HR",
        "last_name": "Tester",
        "role": "HR",
        "is_staff": 1,
        "is_superuser": 0,
        "profile": None,
    },
    {
        "username": "doctor_test",
        "email": "doctor_test@example.com",
        "first_name": "Doctor",
        "last_name": "Tester",
        "role": "DOCTOR",
        "is_staff": 1,
        "is_superuser": 0,
        "profile": "doctor",
        "registration_number": "DOC-TEST-001",
        "specialization": "General Medicine",
    },
    {
        "username": "ehs_test",
        "email": "ehs_test@example.com",
        "first_name": "EHS",
        "last_name": "Tester",
        "role": "EHS",
        "is_staff": 1,
        "is_superuser": 0,
        "profile": None,
    },
    {
        "username": "kam_test",
        "email": "kam_test@example.com",
        "first_name": "KAM",
        "last_name": "Tester",
        "role": "KAM",
        "is_staff": 1,
        "is_superuser": 0,
        "profile": None,
    },
    {
        "username": "employee_test",
        "email": "employee_test@example.com",
        "first_name": "Employee",
        "last_name": "Tester",
        "role": "EMPLOYEE",
        "is_staff": 0,
        "is_superuser": 0,
        "profile": "employee",
    },
]


def upsert_user(cur, user_data):
    timestamp = now_str()
    password_hash = make_password(PASSWORD)
    existing = cur.execute(
        "SELECT id FROM accounts_user WHERE username = ?",
        (user_data["username"],),
    ).fetchone()

    if existing:
        user_id = existing[0]
        cur.execute(
            """
            UPDATE accounts_user
            SET password = ?, email = ?, first_name = ?, last_name = ?, role = ?,
                is_staff = ?, is_superuser = ?, is_active = 1, is_verified = 1,
                must_change_password = 0, phone_number = '', alternate_phone_number = '',
                updated_at = ?
            WHERE id = ?
            """,
            (
                password_hash,
                user_data["email"],
                user_data["first_name"],
                user_data["last_name"],
                user_data["role"],
                user_data["is_staff"],
                user_data["is_superuser"],
                timestamp,
                user_id,
            ),
        )
    else:
        cur.execute(
            """
            INSERT INTO accounts_user (
                password, last_login, is_superuser, username, first_name, last_name,
                is_staff, is_active, date_joined, email, role, phone_number,
                alternate_phone_number, is_verified, must_change_password,
                last_password_changed_at, created_at, updated_at
            ) VALUES (?, NULL, ?, ?, ?, ?, ?, 1, ?, ?, ?, '', '', 1, 0, NULL, ?, ?)
            """,
            (
                password_hash,
                user_data["is_superuser"],
                user_data["username"],
                user_data["first_name"],
                user_data["last_name"],
                user_data["is_staff"],
                timestamp,
                user_data["email"],
                user_data["role"],
                timestamp,
                timestamp,
            ),
        )
        user_id = cur.lastrowid

    return user_id


def upsert_doctor_profile(cur, user_id, user_data):
    timestamp = now_str()
    existing = cur.execute(
        "SELECT id FROM accounts_doctorprofile WHERE user_id = ?",
        (user_id,),
    ).fetchone()

    if existing:
        cur.execute(
            """
            UPDATE accounts_doctorprofile
            SET updated_at = ?, doctor_type = 'OHC', registration_number = ?,
                specialization = ?, qualification = 'MBBS',
                years_of_experience = 5, consultation_fee = '500.00',
                license_expiry = NULL, is_available_for_video = 0, is_active_doctor = 1,
                hospital_id = NULL
            WHERE user_id = ?
            """,
            (timestamp, user_data["registration_number"], user_data["specialization"], user_id),
        )
    else:
        cur.execute(
            """
            INSERT INTO accounts_doctorprofile (
                uuid, created_at, updated_at, doctor_type, registration_number,
                specialization, qualification, years_of_experience, consultation_fee,
                license_expiry, is_available_for_video, is_active_doctor, hospital_id, user_id
            ) VALUES (?, ?, ?, 'OHC', ?, ?, 'MBBS', 5, '500.00',
                      NULL, 0, 1, NULL, ?)
            """,
            (uuid.uuid4().hex, timestamp, timestamp, user_data["registration_number"], user_data["specialization"], user_id),
        )


def upsert_employee_profile(cur, user_id):
    timestamp = now_str()
    existing = cur.execute(
        "SELECT id FROM accounts_employeeprofile WHERE user_id = ?",
        (user_id,),
    ).fetchone()

    if existing:
        cur.execute(
            """
            UPDATE accounts_employeeprofile
            SET updated_at = ?, employee_code = 'EMP-TEST-001', department = 'Operations',
                designation = 'Machine Operator', work_location = 'Plant 1',
                gender = '', blood_group = '', emergency_contact_name = '',
                emergency_contact_phone = '', insurance_policy_number = '',
                fitness_status = 'FIT', medical_certificate_expiry = NULL,
                entry_restricted_until = NULL, is_active_employee = 1, notes = ''
            WHERE user_id = ?
            """,
            (timestamp, user_id),
        )
    else:
        cur.execute(
            """
            INSERT INTO accounts_employeeprofile (
                uuid, created_at, updated_at, employee_code, department, designation,
                work_location, date_of_birth, gender, blood_group, date_of_joining,
                emergency_contact_name, emergency_contact_phone, insurance_policy_number,
                fitness_status, medical_certificate_expiry, entry_restricted_until,
                is_active_employee, notes, user_id
            ) VALUES (?, ?, ?, 'EMP-TEST-001', 'Operations', 'Machine Operator',
                      'Plant 1', NULL, '', '', NULL, '', '', '', 'FIT', NULL, NULL, 1, '', ?)
            """,
            (uuid.uuid4().hex, timestamp, timestamp, user_id),
        )


def write_credentials_file():
    lines = [
        "OHC & AHC Test Users",
        "====================",
        "",
        "Common Password: Test@12345",
        "",
        "1. Admin",
        "username: admin_test",
        "password: Test@12345",
        "",
        "2. Nurse",
        "username: nurse_test",
        "password: Test@12345",
        "",
        "3. On Site Doctor",
        "username: doctor_test",
        "password: Test@12345",
        "",
        "4. EHS",
        "username: ehs_test",
        "password: Test@12345",
        "",
        "5. HR",
        "username: hr_test",
        "password: Test@12345",
        "",
        "6. KAM",
        "username: kam_test",
        "password: Test@12345",
        "",
        "7. Employee",
        "username: employee_test",
        "password: Test@12345",
        "",
        "Notes:",
        "- admin_test can access Django admin.",
        "- nurse_test and doctor_test have OHC clinical profiles for testing intake and diagnosis flows.",
        "- employee_test has an EmployeeProfile with employee code EMP-TEST-001.",
    ]
    CREDENTIALS_PATH.write_text("\n".join(lines), encoding="utf-8")


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    for user_data in USERS:
        user_id = upsert_user(cur, user_data)
        if user_data["profile"] == "doctor":
            upsert_doctor_profile(cur, user_id, user_data)
        elif user_data["profile"] == "employee":
            upsert_employee_profile(cur, user_id)

    conn.commit()
    conn.close()
    write_credentials_file()
    print("created_or_updated_test_users_and_credentials_file")


if __name__ == "__main__":
    main()
