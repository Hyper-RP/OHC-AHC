from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.status import HTTP_404_NOT_FOUND

from accounts.models import DoctorProfile, EmployeeProfile
from accounts.serializers import (
    CurrentUserSerializer,
    DoctorListSerializer,
    EmployeeCreateSerializer,
    EmployeeLookupSerializer,
)


class CurrentUserAPIView(RetrieveAPIView):
    serializer_class = CurrentUserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class DoctorListAPIView(ListAPIView):
    serializer_class = DoctorListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DoctorProfile.objects.filter(
            user__role='DOCTOR',
            is_active_doctor=True
        ).select_related('user')


class EmployeeLookupAPIView(RetrieveAPIView):
    """
    API endpoint for looking up an employee by employee_code.
    Returns employee details if found, 404 if not found.
    """
    serializer_class = EmployeeLookupSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'employee_code'
    queryset = EmployeeProfile.objects.filter(is_active_employee=True).select_related('user')


class EmployeeCreateAPIView(CreateAPIView):
    """
    API endpoint for creating a new employee record.
    Used when an employee doesn't exist in the database.
    """
    serializer_class = EmployeeCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Additional validation can be added here
        serializer.save()

