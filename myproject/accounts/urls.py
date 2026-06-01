from django.urls import path

from accounts.views import (
    CurrentUserAPIView,
    DoctorListAPIView,
    EmployeeCreateAPIView,
    EmployeeLookupAPIView,
)

urlpatterns = [
    path("me/", CurrentUserAPIView.as_view(), name="current-user"),
    path("doctors/", DoctorListAPIView.as_view(), name="doctors-list"),
    path("employees/<str:employee_code>/", EmployeeLookupAPIView.as_view(), name="employee-lookup"),
    path("employees/", EmployeeCreateAPIView.as_view(), name="employee-create"),
]
