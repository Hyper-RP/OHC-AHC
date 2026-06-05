from django.db import migrations


HOSPITALS = [
    {
        "code": "HSP001",
        "name": "City Care Hospital",
        "hospital_type": "Multi-Specialty",
        "contact_person": "Referral Desk",
        "phone_number": "+91-20-4000-1101",
        "email": "referrals@citycare.example.com",
        "address_line_1": "101 Main Road",
        "city": "Pune",
        "state": "Maharashtra",
        "postal_code": "411001",
        "specialties": ["General Medicine", "Orthopedics"],
        "supports_cashless": True,
        "is_available_for_video": False,
    },
    {
        "code": "HSP002",
        "name": "Sunrise Multispeciality",
        "hospital_type": "Multi-Specialty",
        "contact_person": "Patient Care Team",
        "phone_number": "+91-20-4000-1102",
        "email": "connect@sunrise.example.com",
        "address_line_1": "22 Lake View",
        "city": "Pune",
        "state": "Maharashtra",
        "postal_code": "411014",
        "specialties": ["Cardiology", "Pulmonology"],
        "supports_cashless": True,
        "is_available_for_video": True,
    },
    {
        "code": "HSP003",
        "name": "Metro Health Center",
        "hospital_type": "Emergency Care",
        "contact_person": "Emergency Coordination",
        "phone_number": "+91-22-4000-1103",
        "email": "support@metrohealth.example.com",
        "address_line_1": "78 Industrial Belt",
        "city": "Mumbai",
        "state": "Maharashtra",
        "postal_code": "400001",
        "specialties": ["Emergency", "Trauma"],
        "supports_cashless": True,
        "is_available_for_video": False,
    },
    {
        "code": "HSP004",
        "name": "Ruby Hall Clinic",
        "hospital_type": "Tertiary Care",
        "contact_person": "Corporate Desk",
        "phone_number": "+91-20-4000-1104",
        "email": "corpdesk@rubyhall.example.com",
        "address_line_1": "40 Sassoon Road",
        "city": "Pune",
        "state": "Maharashtra",
        "postal_code": "411001",
        "specialties": ["Cardiology", "Neurology", "Emergency"],
        "supports_cashless": True,
        "is_available_for_video": True,
    },
    {
        "code": "HSP005",
        "name": "Jehangir Hospital",
        "hospital_type": "General Hospital",
        "contact_person": "Referral Coordinator",
        "phone_number": "+91-20-4000-1105",
        "email": "referrals@jehangir.example.com",
        "address_line_1": "32 Sassoon Road",
        "city": "Pune",
        "state": "Maharashtra",
        "postal_code": "411001",
        "specialties": ["General Surgery", "Orthopedics", "Diagnostics"],
        "supports_cashless": True,
        "is_available_for_video": False,
    },
    {
        "code": "HSP006",
        "name": "Apollo Hospitals Navi Mumbai",
        "hospital_type": "Super Specialty",
        "contact_person": "Enterprise Helpdesk",
        "phone_number": "+91-22-4000-1106",
        "email": "corporatecare@apollo.example.com",
        "address_line_1": "Sector 23, Parsik Hill Road",
        "city": "Navi Mumbai",
        "state": "Maharashtra",
        "postal_code": "400614",
        "specialties": ["Oncology", "Cardiology", "Nephrology"],
        "supports_cashless": True,
        "is_available_for_video": True,
    },
    {
        "code": "HSP007",
        "name": "Fortis Hospital Mulund",
        "hospital_type": "Multi-Specialty",
        "contact_person": "Corporate Referral Desk",
        "phone_number": "+91-22-4000-1107",
        "email": "mulund.referrals@fortis.example.com",
        "address_line_1": "Mulund Goregaon Link Road",
        "city": "Mumbai",
        "state": "Maharashtra",
        "postal_code": "400078",
        "specialties": ["Trauma Care", "Neurology", "ICU"],
        "supports_cashless": True,
        "is_available_for_video": False,
    },
    {
        "code": "HSP008",
        "name": "Aditya Birla Memorial Hospital",
        "hospital_type": "Multi-Specialty",
        "contact_person": "Partner Relations",
        "phone_number": "+91-20-4000-1108",
        "email": "partners@adityabirla.example.com",
        "address_line_1": "Chinchwad Station Road",
        "city": "Pune",
        "state": "Maharashtra",
        "postal_code": "411033",
        "specialties": ["Pulmonology", "Gastroenterology", "Orthopedics"],
        "supports_cashless": True,
        "is_available_for_video": True,
    },
]


def seed_hospitals(apps, schema_editor):
    Hospital = apps.get_model("ahc", "Hospital")

    for hospital in HOSPITALS:
        Hospital.objects.update_or_create(
            code=hospital["code"],
            defaults={
                **hospital,
                "hospital_status": "ACTIVE",
            },
        )


def unseed_hospitals(apps, schema_editor):
    Hospital = apps.get_model("ahc", "Hospital")
    Hospital.objects.filter(code__in=[hospital["code"] for hospital in HOSPITALS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("ahc", "0002_remove_uuid_from_ahc"),
    ]

    operations = [
        migrations.RunPython(seed_hospitals, unseed_hospitals),
    ]
