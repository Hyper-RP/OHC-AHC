import csv
from io import BytesIO

from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Case, Count, IntegerField, Q, Sum, When
from django.http import HttpResponse
from django.shortcuts import redirect
from django.template.loader import render_to_string
from django.views.generic import TemplateView
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


class PublicLandingView(TemplateView):
    template_name = "frontend/public_home.html"

    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect("dashboard-home")
        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update(
            {
                "page_title": "OHC & AHC Health Management System",
                "public_metrics": {
                    "hospitals": Hospital.objects.filter(hospital_status=Hospital.HospitalStatus.ACTIVE).count(),
                    "reports": MedicalReport.objects.count(),
                    "referrals": Referral.objects.count(),
                    "visits": OHCVisit.objects.count(),
                },
                "workflow_steps": [
                    "Employee visits OHC and intake is recorded.",
                    "Nurse or on site doctor records clinical details and marks the case for treatment or escalation.",
                    "Serious conditions auto-trigger AHC referral, EHS visibility, and hospital selection.",
                    "Reports, payments, alerts, and analytics continue through closure.",
                ],
            }
        )
        return context


class PublicHowItWorksView(TemplateView):
    template_name = "frontend/how_it_works.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["page_title"] = "How To Use The System"
        return context


class FrontendBaseView(LoginRequiredMixin, TemplateView):
    page_title = "Health Portal"
    template_name = "frontend/dashboard.html"

    NAV_ROLE_ACCESS = {
        "dashboard-home": {"ADMIN", "NURSE", "DOCTOR", "EHS", "HR", "KAM"},
        "ohc-visit-form": {"ADMIN", "NURSE", "DOCTOR", "EHS", "HR", "KAM"},
        "diagnosis-entry": {"ADMIN", "NURSE", "DOCTOR"},
        "complete-ohc-intake-page": {"ADMIN", "NURSE", "DOCTOR"},
        "referral-page": {"ADMIN", "NURSE", "DOCTOR", "EHS", "HR", "KAM"},
        "hospital-selection": {"ADMIN", "NURSE", "DOCTOR", "EHS", "HR", "KAM"},
        "reports-page": {"ADMIN", "NURSE", "DOCTOR", "EHS", "HR", "KAM"},
        "employee-health-history-page": {"ADMIN", "NURSE", "DOCTOR", "EHS", "HR", "KAM"},
        "disease-trends-page": {"ADMIN", "NURSE", "DOCTOR", "EHS", "HR", "KAM"},
        "department-health-stats-page": {"ADMIN", "NURSE", "DOCTOR", "EHS", "HR", "KAM"},
        "payment-page": {"ADMIN", "NURSE", "DOCTOR", "EHS", "HR", "KAM"},
    }

    def get_role(self):
        user = self.request.user
        return getattr(user, "role", "ADMIN")

    def is_role_allowed(self, url_name):
        if self.request.user.is_superuser:
            return True
        return self.get_role() in self.NAV_ROLE_ACCESS.get(url_name, set())

    def dispatch(self, request, *args, **kwargs):
        resolver_match = getattr(request, "resolver_match", None)
        if resolver_match and not self.is_role_allowed(resolver_match.url_name):
            return redirect("dashboard-home")
        return super().dispatch(request, *args, **kwargs)

    def get_nav_items(self):
        nav_items = [
            {"label": "Dashboard", "url_name": "dashboard-home", "icon": "grid"},
            {"label": "Complete OHC Intake", "url_name": "complete-ohc-intake-page", "icon": "clipboard"},
            {"label": "Referral Page", "url_name": "referral-page", "icon": "activity"},
            {"label": "Hospital Selection", "url_name": "hospital-selection", "icon": "building"},
            {"label": "Reports", "url_name": "reports-page", "icon": "folder"},
            {"label": "Health History", "url_name": "employee-health-history-page", "icon": "pulse"},
            {"label": "Disease Trends", "url_name": "disease-trends-page", "icon": "chart"},
            {"label": "Department Stats", "url_name": "department-health-stats-page", "icon": "bars"},
            {"label": "Payments", "url_name": "payment-page", "icon": "credit-card"},
        ]
        return [item for item in nav_items if self.is_role_allowed(item["url_name"])]

    def get_common_context(self):
        user = self.request.user
        role = self.get_role()
        employee_profile = getattr(user, "employee_profile", None)
        doctor_profile = getattr(user, "doctor_profile", None)

        if role == "EMPLOYEE" and employee_profile:
            visit_queryset = OHCVisit.objects.filter(employee=employee_profile)
            referral_queryset = Referral.objects.filter(employee=employee_profile)
            report_queryset = MedicalReport.objects.filter(employee=employee_profile)
            invoice_queryset = Invoice.objects.filter(employee=employee_profile)
        elif role in {"DOCTOR", "NURSE"} and doctor_profile:
            visit_queryset = OHCVisit.objects.filter(consulted_doctor=doctor_profile)
            referral_queryset = Referral.objects.filter(referred_by=doctor_profile)
            report_queryset = MedicalReport.objects.filter(uploaded_by=user)
            invoice_queryset = Invoice.objects.all()
        else:
            visit_queryset = OHCVisit.objects.all()
            referral_queryset = Referral.objects.all()
            report_queryset = MedicalReport.objects.all()
            invoice_queryset = Invoice.objects.all()

        return {
            "page_title": self.page_title,
            "active_role": role,
            "active_role_label": dict(user.Role.choices).get(role, role.title()),
            "employee_profile": employee_profile,
            "doctor_profile": doctor_profile,
            "nav_items": self.get_nav_items(),
            "ui_stats": {
                "visit_count": visit_queryset.count(),
                "open_referrals": referral_queryset.exclude(referral_status=Referral.ReferralStatus.COMPLETED).count(),
                "reports_uploaded": report_queryset.count(),
                "pending_invoices": invoice_queryset.exclude(status=Invoice.InvoiceStatus.PAID).count(),
            },
        }

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update(self.get_common_context())
        return context


class DashboardView(FrontendBaseView):
    template_name = "frontend/dashboard.html"
    page_title = "Health Operations Dashboard"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update(
            {
                "metric_cards": [
                    {
                        "title": "OHC Visits",
                        "value": context["ui_stats"]["visit_count"],
                        "subtitle": "Visits tracked in the selected role scope",
                    },
                    {
                        "title": "Open Referrals",
                        "value": context["ui_stats"]["open_referrals"],
                        "subtitle": "Cases awaiting hospital action or closure",
                    },
                    {
                        "title": "Medical Reports",
                        "value": context["ui_stats"]["reports_uploaded"],
                        "subtitle": "Uploaded reports available for review",
                    },
                    {
                        "title": "Pending Invoices",
                        "value": context["ui_stats"]["pending_invoices"],
                        "subtitle": "Invoices not fully paid yet",
                    },
                ],
                "role_panels": self.get_role_panels(),
                "trend_cards": self.get_trend_cards(),
            }
        )
        return context

    def get_role_panels(self):
        role = self.get_role()
        shared = {
            "ADMIN": [
                "Full operational oversight over OHC register workflows, compliance, and analytics.",
                "Manage referrals, medical records, workforce fitness, and cross-site reporting.",
            ],
            "HR": [
                "Track employee health cases for absenteeism and job allocation insights.",
                "Access statutory records during audits and monitor fitness status trends.",
            ],
            "NURSE": [
                "Record daily patient visits, vitals, and basic treatment in the OHC register.",
                "Fill mandatory medical forms, update employee health history, and support surveillance tasks.",
            ],
            "DOCTOR": [
                "Diagnose cases, prescribe treatment, validate medical records, and approve referrals.",
                "Evaluate employee fitness, define surveillance protocols, and ensure clinical readiness.",
            ],
            "EHS": [
                "Monitor incident trends, workplace injuries, hazard mapping, and safety compliance.",
                "Ensure statutory medical compliance, equipment calibration, and environmental disposal reporting.",
            ],
            "KAM": [
                "Review overall usage, client-level summaries, and workforce health delivery performance.",
                "Track compliance delivery, medicine/equipment readiness, and regulatory reporting outcomes.",
            ],
            "EMPLOYEE": [
                "View your own health status, visit history, and referral progress if configured.",
                "Use the portal for personal medical history and follow-up visibility.",
            ],
        }
        return shared.get(role, shared["ADMIN"])

    def get_trend_cards(self):
        diagnosis_summary = (
            Diagnosis.objects.values("severity")
            .annotate(total=Count("id"))
            .order_by("-total")[:4]
        )
        payment_total = Payment.objects.filter(payment_status=Payment.PaymentStatus.SUCCESS).aggregate(
            total=Sum("amount")
        )["total"]

        return {
            "diagnosis_summary": diagnosis_summary,
            "hospital_count": Hospital.objects.filter(hospital_status=Hospital.HospitalStatus.ACTIVE).count(),
            "payment_total": payment_total or 0,
        }


class OHCVisitFormPageView(FrontendBaseView):
    template_name = "frontend/ohc_visit_form.html"
    page_title = "OHC Visit Registration"


class DiagnosisEntryPageView(FrontendBaseView):
    template_name = "frontend/diagnosis_entry.html"
    page_title = "Diagnosis & Prescription Entry"


class CompleteOHCIntakePageView(FrontendBaseView):
    template_name = "frontend/ohc_complete_intake.html"
    page_title = "Complete OHC Intake"


class ReferralPageView(FrontendBaseView):
    template_name = "frontend/referral_page.html"
    page_title = "Referral Management"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["referral_statuses"] = Referral.ReferralStatus.choices
        return context


class HospitalSelectionPageView(FrontendBaseView):
    template_name = "frontend/hospital_selection.html"
    page_title = "Hospital Selection"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["hospitals"] = Hospital.objects.filter(hospital_status=Hospital.HospitalStatus.ACTIVE).order_by("name")[:8]
        return context


class ReportsPageView(FrontendBaseView):
    template_name = "frontend/reports_page.html"
    page_title = "Medical Reports"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["recent_reports"] = MedicalReport.objects.select_related("employee", "hospital").order_by("-report_date")[:8]
        return context


class PaymentPageView(FrontendBaseView):
    template_name = "frontend/payment_page.html"
    page_title = "Payments & Invoices"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["fitness_watchlist"] = EmployeeProfile.objects.exclude(
            fitness_status=EmployeeProfile.FitnessStatus.FIT
        ).order_by("employee_code")[:6]
        return context


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


class EmployeeHealthHistoryPageView(FrontendBaseView):
    template_name = "frontend/employee_health_history.html"
    page_title = "Employee Health History"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        history = build_employee_health_history()
        context["history_rows"] = history[:12]
        return context


class DiseaseTrendsPageView(FrontendBaseView):
    template_name = "frontend/disease_trends.html"
    page_title = "Disease Trends"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["disease_trends"] = build_disease_trends()[:12]
        return context


class DepartmentHealthStatsPageView(FrontendBaseView):
    template_name = "frontend/department_health_stats.html"
    page_title = "Department Health Statistics"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["department_stats"] = build_department_health_stats()
        return context


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


class EmployeeHealthHistoryExcelExportView(LoginRequiredMixin, TemplateView):
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


class DepartmentHealthStatsExcelExportView(LoginRequiredMixin, TemplateView):
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


class AnalyticsPDFExportView(LoginRequiredMixin, TemplateView):
    def get(self, request, *args, **kwargs):
        history_rows = build_employee_health_history()[:10]
        disease_trends = build_disease_trends()[:10]
        department_stats = build_department_health_stats()[:10]

        if canvas is None:
            html = render_to_string(
                "frontend/analytics_pdf_fallback.html",
                {
                    "history_rows": history_rows,
                    "disease_trends": disease_trends,
                    "department_stats": department_stats,
                },
            )
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
