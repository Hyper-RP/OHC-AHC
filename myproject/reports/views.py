import csv
from io import BytesIO

from django.conf import settings
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Case, Count, IntegerField, Q, Sum, When
from django.http import HttpResponse, HttpRequest, FileResponse
from django.shortcuts import redirect
from django.template.loader import render_to_string
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import EmployeeProfile
from accounts.permissions import IsOversightStaff
from ahc.models import Hospital, MedicalReport, Referral
from ohc.models import Diagnosis, OHCVisit
from payments.models import Invoice, Payment
from reports.models import AuditLog, Notification
from reports.serializers import (
    AuditLogSerializer,
    DepartmentHealthStatSerializer,
    DiseaseTrendSerializer,
    EmployeeHealthHistorySerializer,
    NotificationSerializer,
)
from reports.services import run_automated_health_alerts

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
except ImportError:  # pragma: no cover - optional dependency
    canvas = None
    A4 = None


def build_employee_health_history(employee_queryset=None):
    visit_queryset = OHCVisit.objects.select_related(
        "employee",
        "employee__user",
        "consulted_doctor",
        "consulted_doctor__user",
    ).prefetch_related("diagnoses", "referrals", "medical_reports").order_by("-visit_date")
    if employee_queryset is not None:
        visit_queryset = visit_queryset.filter(employee__in=employee_queryset)

    history_rows = []
    for visit in visit_queryset:
        primary_diagnosis = visit.diagnoses.order_by("-is_primary", "-created_at").first()
        latest_referral = visit.referrals.order_by("-created_at").first()
        history_rows.append(
            {
                "employee_code": visit.employee.employee_code,
                "employee_name": visit.employee.user.get_full_name() or visit.employee.user.username,
                "visit_uuid": visit.uuid,
                "visit_date": visit.visit_date,
                "visit_status": visit.visit_status,
                "doctor_name": visit.consulted_doctor.user.get_full_name() or visit.consulted_doctor.user.username,
                "chief_complaint": visit.chief_complaint,
                "diagnosis_name": primary_diagnosis.diagnosis_name if primary_diagnosis else "",
                "severity": primary_diagnosis.severity if primary_diagnosis else "",
                "fitness_decision": primary_diagnosis.fitness_decision if primary_diagnosis else "",
                "follow_up_date": visit.follow_up_date,
                "referral_status": latest_referral.referral_status if latest_referral else "",
                "report_count": visit.medical_reports.count(),
            }
        )
    return history_rows


def build_disease_trends():
    return list(
        Diagnosis.objects.values("diagnosis_name", "severity")
        .annotate(total_cases=Count("id"))
        .order_by("-total_cases", "diagnosis_name")
    )


def build_department_health_stats():
    return list(
        EmployeeProfile.objects.values("department")
        .annotate(
            total_employees=Count("id", distinct=True),
            total_visits=Count("ohc_visits", distinct=True),
            referred_cases=Count(
                "ohc_visits__referrals",
                filter=Q(ohc_visits__requires_referral=True),
                distinct=True,
            ),
            unfit_employees=Count(
                Case(
                    When(
                        fitness_status__in=[
                            EmployeeProfile.FitnessStatus.UNFIT,
                            EmployeeProfile.FitnessStatus.TEMPORARY_UNFIT,
                        ],
                        then=1,
                    ),
                    output_field=IntegerField(),
                ),
                distinct=True,
            ),
        )
        .order_by("department")
    )


class EmployeeHealthHistoryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        employee_code = request.query_params.get("employee_code")
        employee_queryset = EmployeeProfile.objects.all()
        if employee_code:
            employee_queryset = employee_queryset.filter(employee_code=employee_code)

        if getattr(request.user, "role", None) == request.user.Role.EMPLOYEE:
            employee_profile = getattr(request.user, "employee_profile", None)
            employee_queryset = employee_queryset.filter(id=getattr(employee_profile, "id", None))

        data = build_employee_health_history(employee_queryset)
        serializer = EmployeeHealthHistorySerializer(data, many=True)
        return Response(serializer.data)


class DiseaseTrendsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        data = build_disease_trends()
        serializer = DiseaseTrendSerializer(data, many=True)
        return Response(serializer.data)


class DepartmentHealthStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        data = build_department_health_stats()
        serializer = DepartmentHealthStatSerializer(data, many=True)
        return Response(serializer.data)


class EmployeeHealthHistoryExcelExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        employee_code = request.GET.get("employee_code")
        employee_queryset = EmployeeProfile.objects.all()
        if employee_code:
            employee_queryset = employee_queryset.filter(employee_code=employee_code)
        if getattr(request.user, "role", None) == request.user.Role.EMPLOYEE:
            employee_profile = getattr(request.user, "employee_profile", None)
            employee_queryset = employee_queryset.filter(id=getattr(employee_profile, "id", None))

        rows = build_employee_health_history(employee_queryset)
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="employee_health_history.csv"'

        writer = csv.writer(response)
        writer.writerow(
            [
                "Employee Code",
                "Employee Name",
                "Visit UUID",
                "Visit Date",
                "Visit Status",
                "Doctor",
                "Chief Complaint",
                "Diagnosis",
                "Severity",
                "Fitness Decision",
                "Follow Up Date",
                "Referral Status",
                "Report Count",
            ]
        )
        for row in rows:
            writer.writerow(
                [
                    row["employee_code"],
                    row["employee_name"],
                    row["visit_uuid"],
                    row["visit_date"],
                    row["visit_status"],
                    row["doctor_name"],
                    row["chief_complaint"],
                    row["diagnosis_name"],
                    row["severity"],
                    row["fitness_decision"],
                    row["follow_up_date"],
                    row["referral_status"],
                    row["report_count"],
                ]
            )
        return response


class DepartmentHealthStatsExcelExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        rows = build_department_health_stats()
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="department_health_stats.csv"'

        writer = csv.writer(response)
        writer.writerow(
            [
                "Department",
                "Total Employees",
                "Total Visits",
                "Referred Cases",
                "Unfit Employees",
            ]
        )
        for row in rows:
            writer.writerow(
                [
                    row["department"],
                    row["total_employees"],
                    row["total_visits"],
                    row["referred_cases"],
                    row["unfit_employees"],
                ]
            )
        return response


class AnalyticsPDFExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        history_rows = build_employee_health_history()[:10]
        disease_trends = build_disease_trends()[:10]
        department_stats = build_department_health_stats()[:10]

        if canvas is None:
            html = "<html><body><h1>Analytics Export</h1><p>PDF generation not available. Please install reportlab.</p></body></html>"
            return HttpResponse(html, content_type="text/html")

        buffer = BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        y = height - 50

        pdf.setFont("Helvetica-Bold", 16)
        pdf.drawString(40, y, "OHC & AHC Health Analytics Summary")
        y -= 30

        sections = [
            ("Employee Health History", [f'{row["employee_code"]}: {row["diagnosis_name"] or "No diagnosis"} - {row["visit_status"]}' for row in history_rows]),
            ("Disease Trends", [f'{row["diagnosis_name"]} ({row["severity"]}) - {row["total_cases"]}' for row in disease_trends]),
            ("Department Health Stats", [f'{row["department"]}: Employees {row["total_employees"]}, Visits {row["total_visits"]}, Referrals {row["referred_cases"]}' for row in department_stats]),
        ]

        for title, lines in sections:
            if y < 120:
                pdf.showPage()
                y = height - 50
            pdf.setFont("Helvetica-Bold", 12)
            pdf.drawString(40, y, title)
            y -= 20
            pdf.setFont("Helvetica", 10)
            for line in lines:
                if y < 70:
                    pdf.showPage()
                    y = height - 50
                    pdf.setFont("Helvetica", 10)
                pdf.drawString(50, y, line[:105])
                y -= 15
            y -= 12

        pdf.save()
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
        response["Content-Disposition"] = 'attachment; filename="health_analytics_summary.pdf"'
        return response


class NotificationListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        queryset = Notification.objects.select_related("recipient").order_by("-created_at")
        if not request.user.is_superuser and getattr(request.user, "role", None) not in {request.user.Role.ADMIN, request.user.Role.HR, request.user.Role.EHS, request.user.Role.KAM}:
            queryset = queryset.filter(recipient=request.user)
        serializer = NotificationSerializer(queryset[:100], many=True)
        return Response(serializer.data)


class AuditLogListAPIView(APIView):
    permission_classes = [IsAuthenticated, IsOversightStaff]

    def get(self, request, *args, **kwargs):
        queryset = AuditLog.objects.select_related("actor").order_by("-created_at")[:200]
        serializer = AuditLogSerializer(queryset, many=True)
        return Response(serializer.data)


class RunAutoAlertsAPIView(APIView):
    permission_classes = [IsAuthenticated, IsOversightStaff]

    def post(self, request, *args, **kwargs):
        days_ahead = int(request.data.get("days_ahead", 7))
        result = run_automated_health_alerts(days_ahead=days_ahead)
        return Response(result)


class ReactAppView(View):
    def get(self, request, *args, **kwargs):
        try:
            with open(settings.BASE_DIR / 'static' / 'react' / 'index.html', 'r') as f:
                return HttpResponse(f.read(), content_type='text/html')
        except FileNotFoundError:
            return HttpResponse(
                "<h1>React app not found</h1><p>Please run 'npm run build' in the frontend directory.</p>",
                content_type='text/html'
            )
