from datetime import timedelta

from django.utils import timezone

from accounts.access import get_employee_access_state
from accounts.models import EmployeeProfile, User
from ohc.models import OHCVisit
from reports.models import AuditLog, Notification


def create_notification(
    *,
    recipient,
    title,
    message,
    notification_type=Notification.NotificationType.GENERAL,
    channel=Notification.Channel.IN_APP,
    related_model="",
    related_object_uuid="",
    scheduled_for=None,
):
    defaults = {
        "message": message,
        "notification_type": notification_type,
        "channel": channel,
        "scheduled_for": scheduled_for,
        "delivery_status": Notification.DeliveryStatus.PENDING,
    }
    notification, _ = Notification.objects.get_or_create(
        recipient=recipient,
        title=title,
        related_model=related_model,
        related_object_uuid=related_object_uuid,
        defaults=defaults,
    )
    if not _:
        notification.message = message
        notification.notification_type = notification_type
        notification.channel = channel
        notification.scheduled_for = scheduled_for
        notification.save(
            update_fields=[
                "message",
                "notification_type",
                "channel",
                "scheduled_for",
                "updated_at",
            ]
        )
    return notification


def notify_employee_health_status(employee_profile, diagnosis):
    state = get_employee_access_state(employee_profile)
    title = "Health status updated"
    message = (
        f"Diagnosis '{diagnosis.diagnosis_name}' recorded with fitness decision "
        f"'{diagnosis.fitness_decision}'."
    )
    if not state["allowed"]:
        title = "Access restriction in effect"
        message = f"{message} {state['reason']}"

    create_notification(
        recipient=employee_profile.user,
        title=title,
        message=message,
        notification_type=Notification.NotificationType.FITNESS_ALERT,
        related_model="Diagnosis",
        related_object_uuid=str(diagnosis.id),
    )


def notify_follow_up(employee_profile, visit):
    if not visit.follow_up_date:
        return

    create_notification(
        recipient=employee_profile.user,
        title="Upcoming medical follow-up",
        message=(
            f"A follow-up visit is scheduled for {visit.follow_up_date} "
            f"regarding '{visit.chief_complaint}'."
        ),
        notification_type=Notification.NotificationType.APPOINTMENT,
        related_model="OHCVisit",
        related_object_uuid=str(visit.id),
    )


def notify_referral(employee_profile, referral):
    if referral is None:
        return

    create_notification(
        recipient=employee_profile.user,
        title="AHC referral created",
        message=(
            f"Your case has been referred to an authorized health center with "
            f"priority '{referral.priority}'."
        ),
        notification_type=Notification.NotificationType.REFERRAL,
        related_model="Referral",
        related_object_uuid=str(referral.id),
    )


def generate_expired_certificate_alerts():
    today = timezone.localdate()
    profiles = EmployeeProfile.objects.select_related("user").filter(
        medical_certificate_expiry__lt=today,
        user__is_active=True,
    )
    alerts = []
    for profile in profiles:
        alerts.append(
            create_notification(
                recipient=profile.user,
                title="Medical certificate expired",
                message=(
                    f"Medical certificate expired on {profile.medical_certificate_expiry}. "
                    "Please contact OHC for renewal."
                ),
                notification_type=Notification.NotificationType.FITNESS_ALERT,
                related_model="EmployeeProfile",
                related_object_uuid=str(profile.id),
            )
        )
    return alerts


def generate_upcoming_checkup_alerts(days_ahead=7):
    today = timezone.localdate()
    cutoff = today + timedelta(days=days_ahead)
    visits = OHCVisit.objects.select_related("employee", "employee__user").filter(
        follow_up_date__range=(today, cutoff),
    )
    alerts = []
    for visit in visits:
        alerts.append(
            create_notification(
                recipient=visit.employee.user,
                title="Upcoming checkup reminder",
                message=(
                    f"You have a follow-up checkup scheduled for {visit.follow_up_date} "
                    f"for '{visit.chief_complaint}'."
                ),
                notification_type=Notification.NotificationType.APPOINTMENT,
                related_model="OHCVisit",
                related_object_uuid=str(visit.id),
                scheduled_for=timezone.now(),
            )
        )
    return alerts


def notify_hr_watchlist(days_ahead=7):
    today = timezone.localdate()
    oversight_users = User.objects.filter(role__in=[User.Role.HR, User.Role.EHS, User.Role.KAM], is_active=True)
    expiring_profiles = EmployeeProfile.objects.filter(
        medical_certificate_expiry__range=(today, today + timedelta(days=days_ahead))
    )
    restricted_profiles = EmployeeProfile.objects.filter(
        fitness_status__in=[
            EmployeeProfile.FitnessStatus.UNFIT,
            EmployeeProfile.FitnessStatus.TEMPORARY_UNFIT,
        ]
    )
    for hr_user in oversight_users:
        if expiring_profiles.exists():
            create_notification(
                recipient=hr_user,
                title="Certificate expiry watchlist",
                message=f"{expiring_profiles.count()} employees have certificates expiring within {days_ahead} days.",
                notification_type=Notification.NotificationType.FITNESS_ALERT,
                related_model="EmployeeProfile",
            )
        if restricted_profiles.exists():
            create_notification(
                recipient=hr_user,
                title="Restricted entry watchlist",
                message=f"{restricted_profiles.count()} employees are currently restricted from entry.",
                notification_type=Notification.NotificationType.FITNESS_ALERT,
                related_model="EmployeeProfile",
            )


def run_automated_health_alerts(days_ahead=7):
    expired = generate_expired_certificate_alerts()
    checkups = generate_upcoming_checkup_alerts(days_ahead=days_ahead)
    notify_hr_watchlist(days_ahead=days_ahead)
    return {
        "expired_certificate_alerts": len(expired),
        "upcoming_checkup_alerts": len(checkups),
    }


def log_audit_event(
    *,
    actor=None,
    module,
    action,
    target_model,
    target_object_uuid="",
    object_snapshot=None,
    ip_address=None,
    user_agent="",
    remarks="",
):
    return AuditLog.objects.create(
        actor=actor if getattr(actor, "is_authenticated", False) else None,
        module=module,
        action=action,
        target_model=target_model,
        target_object_uuid=target_object_uuid or "",
        object_snapshot=object_snapshot or {},
        ip_address=ip_address,
        user_agent=user_agent[:1000],
        remarks=remarks,
    )
