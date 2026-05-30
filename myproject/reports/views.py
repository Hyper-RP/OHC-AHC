import csv
from io import BytesIO
from textwrap import wrap

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
    from reportlab.lib import colors
    from reportlab.lib.units import inch
    from reportlab.pdfgen import canvas
    from reportlab.platypus import Image as RLImage
    from PIL import Image as PILImage
    import os
except ImportError:  # pragma: no cover - optional dependency
    canvas = None
    A4 = None
    colors = None
    inch = None
    RLImage = None
    PILImage = None
    os = None


def build_employee_health_history(employee_queryset=None):
    visit_queryset = OHCVisit.objects.select_related(
        "employee",
        "employee__user",
        "consulted_doctor",
        "consulted_doctor__user",
    ).prefetch_related("diagnoses", "prescriptions", "referrals", "medical_reports").order_by("-visit_date")
    if employee_queryset is not None:
        visit_queryset = visit_queryset.filter(employee__in=employee_queryset)

    history_rows = []
    for visit in visit_queryset:
        primary_diagnosis = visit.diagnoses.order_by("-is_primary", "-created_at").first()
        latest_referral = visit.referrals.order_by("-created_at").first()
        medicine_given = ", ".join(
            prescription.medicine_name for prescription in visit.prescriptions.all() if prescription.medicine_name
        )
        history_rows.append(
            {
                "employee_code": visit.employee.employee_code,
                "employee_name": visit.employee.user.get_full_name() or visit.employee.user.username,
                "visit_uuid": visit.id,
                "visit_date": visit.visit_date,
                "visit_status": visit.visit_status,
                "doctor_name": visit.consulted_doctor.user.get_full_name() or visit.consulted_doctor.user.username,
                "chief_complaint": visit.chief_complaint,
                "diagnosis_name": primary_diagnosis.diagnosis_name if primary_diagnosis else "",
                "severity": primary_diagnosis.severity if primary_diagnosis else "",
                "fitness_decision": primary_diagnosis.fitness_decision if primary_diagnosis else "",
                "medicine_given": medicine_given,
                "follow_up_date": visit.follow_up_date,
                "referral_status": latest_referral.referral_status if latest_referral else "",
                "report_count": visit.medical_reports.count(),
            }
        )
    return history_rows


def build_employee_health_history_list_payload(employee_queryset=None):
    rows = build_employee_health_history(employee_queryset)
    return {
        "mode": "list",
        "records": [
            {
                "employee_code": row["employee_code"],
                "employee_name": row["employee_name"],
                "visit_uuid": str(row["visit_uuid"]),
                "visit_date": str(row["visit_date"].date()) if hasattr(row["visit_date"], "date") else str(row["visit_date"]),
                "visit_status": row["visit_status"],
                "doctor_name": row["doctor_name"],
                "chief_complaint": row["chief_complaint"],
                "diagnosis_name": row["diagnosis_name"],
                "severity": row["severity"],
                "fitness_decision": row["fitness_decision"],
                "medicine_given": row["medicine_given"],
                "follow_up_date": str(row["follow_up_date"]) if row["follow_up_date"] else "",
                "referral_status": row["referral_status"],
                "report_count": row["report_count"],
            }
            for row in rows
        ],
    }


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


def build_employee_health_history_detail(employee):
    visits_qs = (
        OHCVisit.objects.filter(employee=employee)
        .select_related("consulted_doctor", "consulted_doctor__user")
        .prefetch_related("diagnoses", "prescriptions", "referrals__hospital")
        .order_by("-visit_date")
    )
    referrals_qs = Referral.objects.filter(employee=employee).select_related("hospital").order_by("-created_at")

    return {
        "mode": "detail",
        "employee": {
            "employee_code": employee.employee_code,
            "user": {
                "first_name": employee.user.first_name,
                "last_name": employee.user.last_name,
            },
            "department": employee.department,
            "designation": employee.designation,
            "fitness_status": employee.fitness_status,
        },
        "visits": [
            {
                "id": v.id,
                "visit_date": str(v.visit_date.date()) if hasattr(v.visit_date, "date") else str(v.visit_date),
                "visit_type": v.visit_type,
                "triage_level": v.triage_level,
                "visit_status": v.visit_status,
                "chief_complaint": v.chief_complaint,
                "symptoms": v.symptoms,
                "vitals": v.vitals or {},
                "preliminary_notes": v.preliminary_notes,
                "requires_referral": v.requires_referral,
                "doctor_name": v.consulted_doctor.user.get_full_name() or v.consulted_doctor.user.username,
                "follow_up_date": str(v.follow_up_date) if v.follow_up_date else "",
                "next_action": v.next_action,
                "diagnoses": [
                    {
                        "diagnosis_name": d.diagnosis_name,
                        "severity": d.severity,
                        "fitness_decision": d.fitness_decision,
                        "diagnosed_at": str(d.created_at.date()) if hasattr(d.created_at, "date") else str(d.created_at),
                        "notes": d.diagnosis_notes,
                        "work_restrictions": d.work_restrictions,
                        "rest_days": d.advised_rest_days,
                    }
                    for d in v.diagnoses.all()
                ],
                "prescriptions": [
                    {
                        "medicine_name": p.medicine_name,
                        "dosage": p.dosage,
                        "frequency": p.frequency,
                        "duration_days": p.duration_days,
                        "start_date": str(p.start_date.date()) if hasattr(p.start_date, "date") else str(p.start_date),
                    }
                    for p in v.prescriptions.all()
                ],
                "referrals": [
                    {
                        "hospital_name": referral.hospital.name if referral.hospital else "Unknown",
                        "referral_status": referral.referral_status,
                        "priority": referral.priority,
                        "referral_reason": referral.referral_reason,
                    }
                    for referral in v.referrals.all()
                ],
            }
            for v in visits_qs
        ],
        "referrals": [
            {
                "uuid": str(r.id),
                "hospital_name": r.hospital.name if r.hospital else "Unknown",
                "referral_status": r.referral_status,
                "created_at": str(r.created_at.date()) if hasattr(r.created_at, "date") else str(r.created_at),
            }
            for r in referrals_qs
        ],
    }


def resolve_employee_for_history(request, employee_code=None):
    if employee_code:
        try:
            employee = EmployeeProfile.objects.get(employee_code=employee_code)
        except EmployeeProfile.DoesNotExist:
            return None, Response({"error": "Employee not found"}, status=404)

        if getattr(request.user, "role", None) == request.user.Role.EMPLOYEE:
            if getattr(request.user, "employee_profile", None) != employee:
                return None, Response({"error": "Not authorized to view this record"}, status=403)
        return employee, None

    if getattr(request.user, "role", None) == request.user.Role.EMPLOYEE:
        employee = getattr(request.user, "employee_profile", None)
        if employee is None:
            return None, Response({"error": "Employee profile not found"}, status=404)
        return employee, None

    latest_visit = (
        OHCVisit.objects.select_related("employee", "employee__user")
        .order_by("-visit_date")
        .first()
    )
    if latest_visit is not None:
        return latest_visit.employee, None

    employee = EmployeeProfile.objects.select_related("user").order_by("employee_code").first()
    if employee is None:
        return None, Response({"error": "No employee history available"}, status=404)
    return employee, None


def _draw_wrapped_lines(pdf, text, x, y, width=88, line_height=14, font_name="Helvetica", font_size=10):
    pdf.setFont(font_name, font_size)
    for line in wrap(str(text or "-"), width=width):
        pdf.drawString(x, y, line)
        y -= line_height
    return y


def _draw_receipt_logo(pdf, x, y, page_width=None):
    """
    Draw centered logo at the top of the page.
    If page_width is provided, centers the logo horizontally.
    Returns the y-coordinate below the logo.
    """
    # Try to use the actual logo image
    logo_path = os.path.join(settings.BASE_DIR, 'static', 'react', 'assets', 'mediGplus-CFZGf1el.png')

    if os.path.exists(logo_path) and PILImage is not None:
        try:
            # Get image dimensions and calculate aspect ratio
            with PILImage.open(logo_path) as img:
                width, height = img.size
                aspect_ratio = width / height

            # Set logo size
            logo_height = 50
            logo_width = logo_height * aspect_ratio

            # Calculate center position if page_width is provided
            if page_width:
                x = (page_width - logo_width) / 2

            # Draw the image
            pdf.drawImage(logo_path, x, y - logo_height,
                        width=logo_width, height=logo_height,
                        preserveAspectRatio=True, mask='auto')
            return y - logo_height - 10
        except Exception:
            pass  # Fall through to text-based logo if image fails

    # Fallback to text-based logo
    if colors is None:
        pdf.setFont("Helvetica-Bold", 18)
        if page_width:
            text_width = pdf.stringWidth("MedigPlus", "Helvetica-Bold", 18)
            x = (page_width - text_width) / 2
        pdf.drawString(x, y, "MedigPlus")
        pdf.setFont("Helvetica", 10)
        if page_width:
            text_width = pdf.stringWidth("HEALTHCARE", "Helvetica", 10)
            x = (page_width - text_width) / 2
        pdf.drawString(x, y - 14, "HEALTHCARE")
        return y - 40

    # Colored text-based logo
    pdf.saveState()
    if colors is not None:
        pdf.setFillColor(colors.HexColor("#1499B4"))
        pdf.roundRect(x, y - 34, 38, 38, 8, fill=1, stroke=0)
        pdf.setFillColor(colors.white)
        pdf.roundRect(x + 15, y - 28, 8, 26, 3, fill=1, stroke=0)
        pdf.roundRect(x + 6, y - 19, 26, 8, 3, fill=1, stroke=0)
        pdf.setFillColor(colors.HexColor("#0A3D66"))
    pdf.setFont("Helvetica-Bold", 24)
    pdf.drawString(x + 48, y - 12, "MedigPlus")
    if colors is not None:
        pdf.setFillColor(colors.HexColor("#1499B4"))
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(x + 49, y - 28, "HEALTHCARE")
    pdf.restoreState()
    return y - 40


def _draw_section_band(pdf, x, y, width, title):
    """Draw section band without border."""
    if colors is not None:
        pdf.setFillColor(colors.HexColor("#0A3D66"))
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(x + 8, y - 3, title)
    if colors is not None:
        pdf.setFillColor(colors.black)
    return y - 26


def _draw_info_box(pdf, x, y, width, height, rows):
    """Draw info box without border."""
    if colors is not None:
        pdf.setFillColor(colors.black)

    current_y = y - 18
    for label, value in rows:
        pdf.setFont("Helvetica-Bold", 9)
        pdf.drawString(x + 10, current_y, f"{label}:")
        pdf.setFont("Helvetica", 9)
        pdf.drawString(x + 78, current_y, str(value or "-")[:46])
        current_y -= 14
    return y - height - 12


def _draw_table(pdf, x, y, width, headers, rows, col_widths, row_height=20):
    """Draw a table with proper text wrapping and dynamic row heights - NO BORDERS."""

    # Calculate wrapped text for each cell
    def get_wrapped_lines(text, max_width):
        lines = []
        words = str(text or "-").split()
        current_line = ""
        for word in words:
            test_line = f"{current_line} {word}".strip() if current_line else word
            if pdf.stringWidth(test_line, "Helvetica", 8) <= max_width - 10:
                current_line = test_line
            else:
                if current_line:
                    lines.append(current_line)
                current_line = word
        if current_line:
            lines.append(current_line)
        return lines if lines else ["-"]

    # Calculate max lines per row for proper height
    max_lines_per_cell = {}
    for row_idx, row in enumerate(rows):
        for col_idx, value in enumerate(row):
            lines = get_wrapped_lines(value, col_widths[col_idx])
            max_lines_per_cell[(row_idx, col_idx)] = max(len(lines), 1)

    # Draw header (no border, just text)
    if colors is not None:
        pdf.setFillColor(colors.black)

    current_x = x
    pdf.setFont("Helvetica-Bold", 8)
    for index, header in enumerate(headers):
        pdf.drawString(current_x + 5, y - 14, header)
        current_x += col_widths[index]

    # Draw rows with dynamic height
    current_y = y - row_height
    for row_idx, row in enumerate(rows):
        # Calculate needed height for this row based on wrapped content
        max_lines = max(max_lines_per_cell.get((row_idx, i), 1) for i in range(len(row)))
        needed_height = max_lines * 12 + 8

        # Check if we need a new page
        if current_y - needed_height < 50:
            pdf.showPage()
            current_y = pdf._pagesize[1] - 50
            # Redraw header on new page (no border)
            if colors is not None:
                pdf.setFillColor(colors.black)
            current_x = x
            pdf.setFont("Helvetica-Bold", 8)
            for index, header in enumerate(headers):
                pdf.drawString(current_x + 5, current_y - 14, header)
                current_x += col_widths[index]
            current_y = current_y - row_height

        actual_height = max(needed_height, 20)
        current_y -= actual_height

        # No border, just text
        if colors is not None:
            pdf.setFillColor(colors.black)

        # Draw cell contents with wrapping
        pdf.setFont("Helvetica", 8)
        current_x = x
        for col_idx, value in enumerate(row):
            lines = get_wrapped_lines(value, col_widths[col_idx])
            cell_y = current_y + actual_height - 6
            for line in lines:
                if cell_y > current_y + 4:
                    pdf.drawString(current_x + 5, cell_y, line)
                    cell_y -= 12
            current_x += col_widths[col_idx]

        current_y -= 8
    return current_y


class EmployeeHealthHistoryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        employee_code = request.query_params.get("employee_code")
        if not employee_code:
            employee_queryset = EmployeeProfile.objects.select_related("user")
            if getattr(request.user, "role", None) == request.user.Role.EMPLOYEE:
                employee_profile = getattr(request.user, "employee_profile", None)
                if employee_profile is None:
                    return Response({"error": "Employee profile not found"}, status=404)
                employee_queryset = employee_queryset.filter(id=employee_profile.id)
            return Response(build_employee_health_history_list_payload(employee_queryset))

        employee, error_response = resolve_employee_for_history(request, employee_code)
        if error_response is not None:
            return error_response
        return Response(build_employee_health_history_detail(employee))


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
                "Medicine Given",
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
                    row["medicine_given"],
                    row["follow_up_date"],
                    row["referral_status"],
                    row["report_count"],
                ]
            )
        return response


class EmployeeHealthHistoryPDFExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        employee_code = request.GET.get("employee_code")
        if not employee_code:
            if canvas is None or A4 is None:
                return HttpResponse(
                    "PDF generation is unavailable. Please install reportlab.",
                    content_type="text/plain",
                    status=500,
                )

            employee_queryset = EmployeeProfile.objects.select_related("user")
            if getattr(request.user, "role", None) == request.user.Role.EMPLOYEE:
                employee_profile = getattr(request.user, "employee_profile", None)
                if employee_profile is None:
                    return Response({"error": "Employee profile not found"}, status=404)
                employee_queryset = employee_queryset.filter(id=employee_profile.id)

            rows = build_employee_health_history(employee_queryset)
            if not rows:
                return Response({"error": "No employee history available"}, status=404)

            buffer = BytesIO()
            pdf = canvas.Canvas(buffer, pagesize=A4)
            width, height = A4

            # Draw centered logo
            logo_bottom = _draw_receipt_logo(pdf, 0, height - 40, page_width=width)
            y = logo_bottom - 10

            # Draw centered title
            if colors is not None:
                pdf.setFillColor(colors.HexColor("#0A3D66"))
            pdf.setFont("Helvetica-Bold", 18)
            title = "Employee Health History Report"
            title_width = pdf.stringWidth(title, "Helvetica-Bold", 18)
            pdf.drawString((width - title_width) / 2, y, title)
            y -= 25
            if colors is not None:
                pdf.setFillColor(colors.black)
            pdf.setFont("Helvetica", 11)
            subtitle = f"Total Records: {len(rows)}"
            subtitle_width = pdf.stringWidth(subtitle, "Helvetica", 11)
            pdf.drawString((width - subtitle_width) / 2, y, subtitle)
            y -= 40

            # Table configuration with better column widths
            headers = [
                "Emp ID",
                "Employee Name",
                "Visit Date",
                "Complaint",
                "Doctor",
                "Diagnosis",
                "Fitness",
            ]
            col_widths = [70, 100, 85, 95, 85, 85, 65]  # Total: ~585 width (fits in A4 with margins)

            def draw_headers(current_y):
                """Draw table headers without borders."""
                row_height = 25
                if colors is not None:
                    pdf.setFillColor(colors.black)
                pdf.setFont("Helvetica-Bold", 9)
                current_x = 40
                for header, col_width in zip(headers, col_widths):
                    pdf.drawString(current_x, current_y - 8, header)
                    current_x += col_width + 5
                return current_y - row_height - 5

            def draw_row(current_y, row_data):
                """Draw a single row with text wrapping, no borders."""
                row_height = 20
                if colors is not None:
                    pdf.setFillColor(colors.black)

                pdf.setFont("Helvetica", 8)
                current_x = 40

                for value, col_width in zip(row_data, col_widths):
                    # Truncate or wrap text based on column width
                    text = str(value or "-")
                    max_chars = int(col_width / 3.5)  # Approximate chars that fit
                    if len(text) > max_chars:
                        text = text[:max_chars - 3] + "..."
                    pdf.drawString(current_x, current_y - 6, text)
                    current_x += col_width + 5

                return current_y - row_height - 3

            # Draw headers
            y = draw_headers(y)

            # Draw data rows
            for row in rows:
                if y < 80:  # Need new page
                    pdf.showPage()
                    y = height - 50
                    # Redraw centered logo and headers on new page
                    logo_bottom = _draw_receipt_logo(pdf, 0, height - 40, page_width=width)
                    y = logo_bottom - 10
                    if colors is not None:
                        pdf.setFillColor(colors.HexColor("#0A3D66"))
                    pdf.setFont("Helvetica-Bold", 18)
                    continued_title = "Employee Health History Report (continued)"
                    title_width = pdf.stringWidth(continued_title, "Helvetica-Bold", 18)
                    pdf.drawString((width - title_width) / 2, y, continued_title)
                    y -= 30
                    y = draw_headers(y)

                values = [
                    row["employee_code"],
                    row["employee_name"],
                    str(row["visit_date"].date()) if hasattr(row["visit_date"], "date") else str(row["visit_date"]),
                    row["chief_complaint"],
                    row["doctor_name"],
                    row["diagnosis_name"] or "-",
                    row["fitness_decision"] or "-",
                ]
                y = draw_row(y, values)

            # Add centered footer
            y -= 20
            if y > 100:
                if colors is not None:
                    pdf.setStrokeColor(colors.HexColor("#C8DAE8"))
                pdf.line(50, y, width - 50, y)
                y -= 20
                pdf.setFont("Helvetica", 9)
                footer_text = "Generated by MedigPlus Healthcare System"
                footer_width = pdf.stringWidth(footer_text, "Helvetica", 9)
                pdf.drawString((width - footer_width) / 2, y, footer_text)
                y -= 12
                pdf.setFont("Helvetica", 8)
                timestamp = f"Generated on: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M')}"
                timestamp_width = pdf.stringWidth(timestamp, "Helvetica", 8)
                pdf.drawString((width - timestamp_width) / 2, y, timestamp)

            pdf.save()
            buffer.seek(0)
            response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
            response["Content-Disposition"] = 'attachment; filename="all_employee_health_history.pdf"'
            return response

        employee, error_response = resolve_employee_for_history(request, employee_code)
        if error_response is not None:
            return error_response
        if canvas is None or A4 is None:
            return HttpResponse(
                "PDF generation is unavailable. Please install reportlab.",
                content_type="text/plain",
                status=500,
            )

        history = build_employee_health_history_detail(employee)
        employee_info = history["employee"]
        visits = history["visits"]

        buffer = BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        def start_page():
            if colors is not None:
                pdf.setFillColor(colors.HexColor("#F8FBFE"))
                pdf.rect(0, 0, width, height, fill=1, stroke=0)
                pdf.setFillColor(colors.HexColor("#0A3D66"))
                pdf.rect(0, height - 80, width, 80, fill=1, stroke=0)
                pdf.setFillColor(colors.black)

            # Draw centered logo
            logo_bottom = _draw_receipt_logo(pdf, 0, height - 30, page_width=width)

            # Draw receipt info box on the right
            if colors is not None:
                pdf.setFillColor(colors.white)
            receipt_x = width - 170
            receipt_y = logo_bottom + 10
            if colors is not None:
                pdf.roundRect(receipt_x, receipt_y - 38, 130, 34, 6, fill=1, stroke=0)
                pdf.setFillColor(colors.black)
            pdf.setFont("Helvetica-Bold", 8)
            pdf.drawString(receipt_x + 10, receipt_y - 12, "Receipt No.")
            pdf.drawString(receipt_x + 10, receipt_y - 26, "Employee ID")
            pdf.setFont("Helvetica", 8)
            pdf.drawString(receipt_x + 55, receipt_y - 12, f"RCP-{employee_info['employee_code']}")
            pdf.drawString(receipt_x + 55, receipt_y - 26, employee_info["employee_code"])

            # Return position below logo
            return logo_bottom - 10

        def ensure_space(y, needed=70):
            if y < needed:
                pdf.showPage()
                return start_page()
            return y

        y = start_page()
        full_name = f"{employee_info['user']['first_name']} {employee_info['user']['last_name']}".strip()

        y = _draw_section_band(pdf, 40, y, width - 80, "Patient Information")
        y = _draw_info_box(
            pdf,
            40,
            y,
            width - 80,
            92,
            [
                ("Patient Name", full_name or employee_info["employee_code"]),
                ("Employee Code", employee_info["employee_code"]),
                ("Department", employee_info["department"] or "-"),
                ("Fitness Status", employee_info["fitness_status"] or "-"),
                ("Total Visits", len(visits)),
            ],
        )

        for index, visit in enumerate(visits, start=1):
            y = ensure_space(y, 230)
            y = _draw_section_band(pdf, 40, y, width - 80, f"Visit {index}")
            y = _draw_info_box(
                pdf,
                40,
                y,
                width - 80,
                106,
                [
                    ("Visit Date", visit["visit_date"]),
                    ("Visit Type", visit["visit_type"]),
                    ("Triage Level", visit["triage_level"]),
                    ("Visit Status", visit["visit_status"]),
                    ("Attending Doctor", visit["doctor_name"]),
                    ("Requires Referral", "Yes" if visit["requires_referral"] else "No"),
                    ("Follow Up Date", visit["follow_up_date"] or "-"),
                ],
            )

            y = ensure_space(y, 90)
            y = _draw_section_band(pdf, 40, y, width - 80, "Clinical Notes")
            pdf.setFont("Helvetica-Bold", 10)
            pdf.drawString(50, y, "Chief Complaint")
            y -= 14
            y = _draw_wrapped_lines(pdf, visit["chief_complaint"], 55, y, width=90)
            y -= 6

            pdf.setFont("Helvetica-Bold", 10)
            pdf.drawString(50, y, "Symptoms")
            y -= 14
            y = _draw_wrapped_lines(pdf, visit["symptoms"], 55, y, width=90)
            y -= 6

            pdf.setFont("Helvetica-Bold", 10)
            pdf.drawString(50, y, "Next Action")
            y -= 14
            y = _draw_wrapped_lines(pdf, visit["next_action"] or "-", 55, y, width=90)
            y -= 6

            if visit["vitals"]:
                y = ensure_space(y, 80)
                y = _draw_section_band(pdf, 40, y, width - 80, "Vitals")
                for vital_name, vital_value in visit["vitals"].items():
                    y = _draw_wrapped_lines(
                        pdf,
                        f"{vital_name.replace('_', ' ').title()}: {vital_value}",
                        50,
                        y,
                        width=92,
                    )
                y -= 6

            if visit["preliminary_notes"]:
                y = ensure_space(y, 80)
                y = _draw_section_band(pdf, 40, y, width - 80, "Preliminary Notes")
                y = _draw_wrapped_lines(pdf, visit["preliminary_notes"], 50, y, width=92)
                y -= 6

            y = ensure_space(y, 90)
            y = _draw_section_band(pdf, 40, y, width - 80, "Diagnosis Summary")
            if visit["diagnoses"]:
                diagnosis_rows = []
                for diagnosis in visit["diagnoses"]:
                    diagnosis_rows.append(
                        [
                            diagnosis["diagnosis_name"],
                            diagnosis["severity"],
                            diagnosis["fitness_decision"],
                            diagnosis["rest_days"] or "-",
                        ]
                    )
                y = _draw_table(
                    pdf,
                    45,
                    y,
                    width - 90,
                    ["Diagnosis", "Severity", "Fitness", "Rest Days"],
                    diagnosis_rows,
                    [190, 90, 120, 80],
                )
                for diagnosis in visit["diagnoses"]:
                    if diagnosis["work_restrictions"] or diagnosis["notes"]:
                        y = ensure_space(y, 70)
                        if diagnosis["work_restrictions"]:
                            pdf.setFont("Helvetica-Bold", 9)
                            pdf.drawString(50, y, f"{diagnosis['diagnosis_name']} Restrictions")
                            y -= 13
                            y = _draw_wrapped_lines(pdf, diagnosis["work_restrictions"], 55, y, width=90, font_size=9)
                        if diagnosis["notes"]:
                            pdf.setFont("Helvetica-Bold", 9)
                            pdf.drawString(50, y, f"{diagnosis['diagnosis_name']} Notes")
                            y -= 13
                            y = _draw_wrapped_lines(pdf, diagnosis["notes"], 55, y, width=90, font_size=9)
                        y -= 6
            else:
                pdf.setFont("Helvetica", 10)
                pdf.drawString(50, y, "No diagnosis recorded")
                y -= 15

            y = ensure_space(y, 90)
            y = _draw_section_band(pdf, 40, y, width - 80, "Prescription")
            if visit["prescriptions"]:
                prescription_rows = []
                for prescription in visit["prescriptions"]:
                    prescription_rows.append(
                        [
                            prescription["medicine_name"],
                            prescription["dosage"],
                            prescription["frequency"],
                            f"{prescription['duration_days']} days",
                        ]
                    )
                y = _draw_table(
                    pdf,
                    45,
                    y,
                    width - 90,
                    ["Medicine", "Dosage", "Frequency", "Duration"],
                    prescription_rows,
                    [190, 110, 120, 90],
                )
            else:
                pdf.setFont("Helvetica", 10)
                pdf.drawString(50, y, "No prescription recorded")
                y -= 15

            y = ensure_space(y, 90)
            y = _draw_section_band(pdf, 40, y, width - 80, "Referral")
            if visit["referrals"]:
                referral_rows = []
                for referral in visit["referrals"]:
                    referral_rows.append(
                        [
                            referral["hospital_name"],
                            referral["referral_status"],
                            referral["priority"],
                        ]
                    )
                y = _draw_table(
                    pdf,
                    45,
                    y,
                    width - 90,
                    ["Hospital", "Status", "Priority"],
                    referral_rows,
                    [260, 120, 105],
                )
                for referral in visit["referrals"]:
                    if referral["referral_reason"]:
                        pdf.setFont("Helvetica-Bold", 9)
                        pdf.drawString(50, y, f"{referral['hospital_name']} Reason")
                        y -= 13
                        y = _draw_wrapped_lines(pdf, referral["referral_reason"], 55, y, width=90, font_size=9)
                        y -= 6
            else:
                pdf.setFont("Helvetica", 10)
                pdf.drawString(50, y, "No referral recorded")
                y -= 15

            y -= 8

        y = ensure_space(y, 120)
        y = _draw_section_band(pdf, 40, y, width - 80, "Acknowledgement")
        if colors is not None:
            pdf.setStrokeColor(colors.HexColor("#C8DAE8"))
        pdf.line(55, y - 8, 230, y - 8)
        pdf.line(width - 230, y - 8, width - 55, y - 8)
        pdf.setFont("Helvetica", 9)
        pdf.drawString(95, y - 22, "Patient Signature")
        pdf.drawString(width - 185, y - 22, "Authorized Medical Officer")
        y -= 42
        pdf.setFont("Helvetica", 9)
        pdf.drawString(40, y, "This receipt summarizes the patient's recorded OHC/AHC treatment, medicine, and referral details.")
        y -= 13
        pdf.drawString(40, y, "Please keep this document for future consultation, reimbursement, and follow-up reference.")

        pdf.save()
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
        response["Content-Disposition"] = (
            f'attachment; filename="employee_{employee_info["employee_code"]}_health_receipt.pdf"'
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
