from datetime import timedelta

from django.utils import timezone

from accounts.models import EmployeeProfile
from ahc.models import Referral
from ohc.models import Diagnosis, OHCVisit
from reports.services import notify_employee_health_status, notify_follow_up, notify_referral


SERIOUS_SEVERITIES = {Diagnosis.Severity.SERIOUS, Diagnosis.Severity.CRITICAL}
UNFIT_DECISIONS = {
    Diagnosis.FitnessDecision.UNFIT,
    Diagnosis.FitnessDecision.TEMPORARY_UNFIT,
}


def apply_fitness_decision(employee, diagnosis):
    today = timezone.localdate()

    if diagnosis.fitness_decision == Diagnosis.FitnessDecision.UNFIT:
        employee.fitness_status = EmployeeProfile.FitnessStatus.UNFIT
        employee.entry_restricted_until = None
    elif diagnosis.fitness_decision == Diagnosis.FitnessDecision.TEMPORARY_UNFIT:
        employee.fitness_status = EmployeeProfile.FitnessStatus.TEMPORARY_UNFIT
        restriction_days = diagnosis.advised_rest_days or 1
        employee.entry_restricted_until = today + timedelta(days=restriction_days)
    elif diagnosis.fitness_decision == Diagnosis.FitnessDecision.FIT_WITH_RESTRICTION:
        employee.fitness_status = EmployeeProfile.FitnessStatus.UNDER_OBSERVATION
        employee.entry_restricted_until = diagnosis.follow_up_date
    else:
        employee.fitness_status = EmployeeProfile.FitnessStatus.FIT
        employee.entry_restricted_until = None

    employee.save(update_fields=["fitness_status", "entry_restricted_until", "updated_at"])


def schedule_follow_up_for_visit(visit, diagnosis):
    if diagnosis.follow_up_date:
        visit.follow_up_date = diagnosis.follow_up_date
        visit.next_action = "FOLLOW_UP"
    elif diagnosis.condition_status == Diagnosis.ConditionStatus.RESOLVED:
        visit.next_action = "DISCHARGE"
    else:
        visit.next_action = "CONTINUE_OHC_TREATMENT"


def create_referral_if_required(diagnosis):
    visit = diagnosis.visit
    requires_referral = diagnosis.is_referral_required or diagnosis.severity in SERIOUS_SEVERITIES

    visit.requires_referral = requires_referral
    if requires_referral:
        visit.visit_status = OHCVisit.VisitStatus.REFERRED
        visit.next_action = "REFER_TO_AHC"

        referral, created = Referral.objects.get_or_create(
            diagnosis=diagnosis,
            defaults={
                "visit": visit,
                "employee": visit.employee,
                "referred_by": diagnosis.diagnosed_by,
                "referral_reason": diagnosis.diagnosis_notes or diagnosis.diagnosis_name,
                "specialist_department": diagnosis.diagnosis_name,
                "priority": (
                    Referral.ReferralPriority.EMERGENCY
                    if diagnosis.severity == Diagnosis.Severity.CRITICAL
                    else Referral.ReferralPriority.URGENT
                ),
                "referral_status": Referral.ReferralStatus.PENDING_HOSPITAL_SELECTION,
            },
        )
        if not created:
            referral.visit = visit
            referral.employee = visit.employee
            referral.referred_by = diagnosis.diagnosed_by
            referral.referral_reason = diagnosis.diagnosis_notes or diagnosis.diagnosis_name
            referral.specialist_department = diagnosis.diagnosis_name
            referral.priority = (
                Referral.ReferralPriority.EMERGENCY
                if diagnosis.severity == Diagnosis.Severity.CRITICAL
                else Referral.ReferralPriority.URGENT
            )
            referral.referral_status = Referral.ReferralStatus.PENDING_HOSPITAL_SELECTION
            referral.save()
        return referral

    visit.visit_status = OHCVisit.VisitStatus.IN_PROGRESS
    return None


def process_diagnosis_outcome(diagnosis):
    visit = diagnosis.visit
    employee = visit.employee

    apply_fitness_decision(employee, diagnosis)
    schedule_follow_up_for_visit(visit, diagnosis)
    referral = create_referral_if_required(diagnosis)
    visit.save(
        update_fields=[
            "requires_referral",
            "visit_status",
            "follow_up_date",
            "next_action",
            "updated_at",
        ]
    )
    notify_employee_health_status(employee, diagnosis)
    notify_follow_up(employee, visit)
    notify_referral(employee, referral)
    return referral
