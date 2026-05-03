from django.utils import timezone
from rest_framework.permissions import BasePermission

from accounts.access import get_employee_access_state
from accounts.models import User


CLINICAL_ROLES = {User.Role.NURSE, User.Role.DOCTOR}
COMPLIANCE_ROLES = {User.Role.EHS, User.Role.HR, User.Role.KAM}
OVERSIGHT_ROLES = {User.Role.EHS, User.Role.HR, User.Role.KAM, User.Role.ADMIN}
FULL_STAFF_ROLES = CLINICAL_ROLES | COMPLIANCE_ROLES | {User.Role.ADMIN}


def _has_any_role(user, allowed_roles):
    return bool(user and user.is_authenticated and (user.is_superuser or user.role in allowed_roles))


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return _has_any_role(request.user, {User.Role.ADMIN})


class IsAdminOrHR(BasePermission):
    def has_permission(self, request, view):
        return _has_any_role(request.user, {User.Role.ADMIN, User.Role.HR})


class IsDoctorOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return _has_any_role(request.user, {User.Role.ADMIN, User.Role.DOCTOR})


class IsDoctorHRAdmin(BasePermission):
    def has_permission(self, request, view):
        return _has_any_role(request.user, {User.Role.ADMIN, User.Role.DOCTOR, User.Role.HR})


class IsClinicalStaff(BasePermission):
    def has_permission(self, request, view):
        return _has_any_role(request.user, CLINICAL_ROLES | {User.Role.ADMIN})


class IsClinicalOrComplianceStaff(BasePermission):
    def has_permission(self, request, view):
        return _has_any_role(request.user, FULL_STAFF_ROLES)


class IsOversightStaff(BasePermission):
    def has_permission(self, request, view):
        return _has_any_role(request.user, OVERSIGHT_ROLES)


class IsEmployeeSelfOrStaff(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or user.role in FULL_STAFF_ROLES:
            return True
        employee_profile = getattr(user, "employee_profile", None)
        return employee_profile is not None and obj == employee_profile


class HasHealthPortalAccess(BasePermission):
    message = "Employee access is restricted."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or user.role != User.Role.EMPLOYEE:
            return True

        employee_profile = getattr(user, "employee_profile", None)
        if employee_profile is None:
            return True

        state = get_employee_access_state(employee_profile)
        self.message = state["reason"] or self.message
        return state["allowed"]
