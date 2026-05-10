from django.urls import path

from reports.views import (
    AnalyticsPDFExportView,
    AuditLogListAPIView,
    DepartmentHealthStatsAPIView,
    DepartmentHealthStatsExcelExportView,
    DiseaseTrendsAPIView,
    EmployeeHealthHistoryAPIView,
    EmployeeHealthHistoryExcelExportView,
    NotificationListAPIView,
    ReactAppView,
    RunAutoAlertsAPIView,
)

urlpatterns = [
    path("", ReactAppView.as_view(), name="react-app"),
    path("api/reports/employee-health-history/", EmployeeHealthHistoryAPIView.as_view(), name="employee-health-history-api"),
    path("api/reports/disease-trends/", DiseaseTrendsAPIView.as_view(), name="disease-trends-api"),
    path("api/reports/department-health-stats/", DepartmentHealthStatsAPIView.as_view(), name="department-health-stats-api"),
    path("api/reports/notifications/", NotificationListAPIView.as_view(), name="notifications-api"),
    path("api/reports/audit-logs/", AuditLogListAPIView.as_view(), name="audit-logs-api"),
    path("api/reports/run-auto-alerts/", RunAutoAlertsAPIView.as_view(), name="run-auto-alerts-api"),
    path("api/exports/employee-health-history.csv", EmployeeHealthHistoryExcelExportView.as_view(), name="employee-history-export"),
    path("api/exports/department-health-stats.csv", DepartmentHealthStatsExcelExportView.as_view(), name="department-stats-export"),
    path("api/exports/analytics-summary.pdf", AnalyticsPDFExportView.as_view(), name="analytics-pdf-export"),
]
