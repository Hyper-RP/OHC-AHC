from django.utils import timezone

from accounts.models import EmployeeProfile


def get_employee_access_state(employee_profile):
    if employee_profile is None:
        return {
            "allowed": True,
            "reason": "",
        }

    today = timezone.localdate()

    if (
        employee_profile.medical_certificate_expiry
        and employee_profile.medical_certificate_expiry < today
    ):
        return {
            "allowed": False,
            "reason": "Medical certificate has expired.",
        }

    if employee_profile.fitness_status == EmployeeProfile.FitnessStatus.UNFIT:
        return {
            "allowed": False,
            "reason": "Employee is marked UNFIT.",
        }

    if employee_profile.fitness_status == EmployeeProfile.FitnessStatus.TEMPORARY_UNFIT:
        restricted_until = employee_profile.entry_restricted_until
        if restricted_until is None or restricted_until >= today:
            return {
                "allowed": False,
                "reason": f"Employee is temporarily unfit until {restricted_until or 'medical clearance'}.",
            }

    return {
        "allowed": True,
        "reason": "",
    }
