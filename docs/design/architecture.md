# Phase 3: Design — Remove Python Frontend Dependencies

**Project:** OHC-AHC — Remove Django Template Frontend Dependencies
**Date:** 2026-05-08
**Status:** In Progress

---

## Progress Bar
```
[████████████████████████████████████████████████████] Phase 1: Planning (Completed)
[████████████████████████████████████████████████████] Phase 2: Requirements (Completed)
[████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 3: Design (In Progress)
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 4: Development
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 5: Testing
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 6: Deployment
```

---

## Current Architecture

### Before Cleanup

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Browser (User)                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────┐  ┌──────────────────────┐                   │
│  │   Django Templates   │  │    React SPA         │                   │
│  │   (Old Frontend)     │  │    (New Frontend)    │                   │
│  │                      │  │                      │                   │
│  │  - base.html         │  │  - Login.tsx         │                   │
│  │  - dashboard.html    │  │  - Dashboard.tsx     │                   │
│  │  - ohc_visit.html    │  │  - OHCVisitForm.tsx  │                   │
│  │  - ... (15 files)    │  │  - ... (React pages) │                   │
│  │                      │  │                      │                   │
│  └──────────┬───────────┘  └──────────┬───────────┘                   │
│             │                         │                               │
│             └─────────┬───────────────┘                               │
│                       │                                               │
└───────────────────────┼───────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    Django Backend                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  URL Configuration                                              │    │
│  │  ┌────────────────────────────────────────────────────────┐   │    │
│  │  │ Template Routes (TO BE REMOVED)                         │   │    │
│  │  │  - /                    → PublicLandingView             │   │    │
│  │  │  - /dashboard/          → DashboardView                │   │    │
│  │  │  - /ohc/visit-form/     → OHCVisitFormPageView         │   │    │
│  │  │  - ... (13 routes)                                          │   │    │
│  │  └────────────────────────────────────────────────────────┘   │    │
│  │  ┌────────────────────────────────────────────────────────┐   │    │
│  │  │ API Routes (TO BE KEPT)                                 │   │    │
│  │  │  - /api/auth/token/                                     │   │    │
│  │  │  - /api/ohc/visits/                                     │   │    │
│  │  │  - /api/ahc/hospitals/                                  │   │    │
│  │  │  - ... (all /api/* routes)                              │   │    │
│  │  └────────────────────────────────────────────────────────┘   │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  Views                                                          │    │
│  │  ┌────────────────────────────────────────────────────────┐   │    │
│  │  │ Template Views (TO BE REMOVED)                         │   │    │
│  │  │  - PublicLandingView                                    │   │    │
│  │  │  - DashboardView                                         │   │    │
│  │  │  - OHCVisitFormPageView                                 │   │    │
│  │  │  - ... (13 views)                                       │   │    │
│  │  └────────────────────────────────────────────────────────┘   │    │
│  │  ┌────────────────────────────────────────────────────────┐   │    │
│  │  │ API Views (TO BE KEPT)                                 │   │    │
│  │  │  - EmployeeHealthHistoryAPIView                        │   │    │
│  │  │  - DiseaseTrendsAPIView                                │   │    │
│  │  │  - DepartmentHealthStatsAPIView                         │   │    │
│  │  │  - ... (all APIView subclasses)                         │   │    │
│  │  └────────────────────────────────────────────────────────┘   │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  Static Files                                                   │    │
│  │  - /static/frontend/    → Old CSS/JS (TO BE REMOVED)            │    │
│  │  - /static/react/       → React build (TO BE KEPT)               │    │
│  │  - /static/admin/       → Django admin (TO BE KEPT)              │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  Templates                                                      │    │
│  │  - /templates/frontend/   → Old templates (TO BE REMOVED)       │    │
│  │  - /templates/registration/ → Login template (TO BE REMOVED)    │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    SQLite Database                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### After Cleanup

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Browser (User)                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    React SPA (Frontend)                        │    │
│  │                                                                  │    │
│  │  - Login.tsx         - Dashboard.tsx                            │    │
│  │  - OHCVisitForm.tsx  - DiagnosisEntry.tsx                       │    │
│  │  - ReferralPage.tsx  - HospitalSelection.tsx                    │    │
│  │  - ReportsPage.tsx   - EmployeeHealthHistory.tsx                │    │
│  │  - DiseaseTrends.tsx - DepartmentStats.tsx                      │    │
│  │  - PaymentPage.tsx   - ...                                      │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                        │
                        ↓ (HTTP/HTTPS with JWT)
┌─────────────────────────────────────────────────────────────────────────┐
│              Django Backend (API-Only)                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  URL Configuration                                              │    │
│  │  ┌────────────────────────────────────────────────────────┐   │    │
│  │  │ API Routes                                             │   │    │
│  │  │  - /api/auth/token/                                     │   │    │
│  │  │  - /api/auth/token/refresh/                             │   │    │
│  │  │  - /api/accounts/me/                                    │   │    │
│  │  │  - /api/ohc/visits/                                     │   │    │
│  │  │  - /api/ohc/diagnosis-prescriptions/                    │   │    │
│  │  │  - /api/ahc/hospitals/                                  │   │    │
│  │  │  - /api/ahc/referrals/                                  │   │    │
│  │  │  - /api/payments/invoices/                              │   │    │
│  │  │  - /api/payments/payments/                              │   │    │
│  │  │  - /api/reports/employee-health-history/                │   │    │
│  │  │  - /api/reports/disease-trends/                         │   │    │
│  │  │  - /api/reports/department-health-stats/                │   │    │
│  │  │  - /api/reports/notifications/                          │   │    │
│  │  │  - /api/reports/audit-logs/                             │   │    │
│  │  │  - /api/reports/run-auto-alerts/                        │   │    │
│  │  └────────────────────────────────────────────────────────┘   │    │
│  │  ┌────────────────────────────────────────────────────────┐   │    │
│  │  │ Export Routes                                           │   │    │
│  │  │  - /exports/employee-health-history.csv                │   │    │
│  │  │  - /exports/department-health-stats.csv                 │   │    │
│  │  │  - /exports/analytics-summary.pdf                       │   │    │
│  │  └────────────────────────────────────────────────────────┘   │    │
│  │  ┌────────────────────────────────────────────────────────┐   │    │
│  │  │ Admin Routes                                            │   │    │
│  │  │  - /admin/                                              │   │    │
│  │  │  - /admin/login/                                        │   │    │
│  │  └────────────────────────────────────────────────────────┘   │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  Views (API + Export Only)                                     │    │
│  │  ┌────────────────────────────────────────────────────────┐   │    │
│  │  │ API Views (APIView subclasses)                         │   │    │
│  │  │  - EmployeeHealthHistoryAPIView                        │   │    │
│  │  │  - DiseaseTrendsAPIView                                │   │    │
│  │  │  - DepartmentHealthStatsAPIView                         │   │    │
│  │  │  - NotificationListAPIView                             │   │    │
│  │  │  - AuditLogListAPIView                                 │   │    │
│  │  │  - RunAutoAlertsAPIView                                │   │    │
│  │  └────────────────────────────────────────────────────────┘   │    │
│  │  ┌────────────────────────────────────────────────────────┐   │    │
│  │  │ Export Views                                            │   │    │
│  │  │  - EmployeeHealthHistoryExcelExportView                │   │    │
│  │  │  - DepartmentHealthStatsExcelExportView                 │   │    │
│  │  │  - AnalyticsPDFExportView                               │   │    │
│  │  └────────────────────────────────────────────────────────┘   │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  Static Files                                                   │    │
│  │  - /static/react/       → React build (served by Django)        │    │
│  │  - /static/admin/       → Django admin                         │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  Settings                                                       │    │
│  │  - LOGIN_URL = '/login'        (React route)                    │    │
│  │  - LOGIN_REDIRECT_URL = '/dashboard' (React route)              │    │
│  │  - LOGOUT_REDIRECT_URL = '/'    (React home)                    │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    SQLite Database                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Step 1: Remove Django Template Files

**Files to Delete:**
```
myproject/templates/frontend/
├── base.html
├── dashboard.html
├── department_health_stats.html
├── diagnosis_entry.html
├── disease_trends.html
├── employee_health_history.html
├── hospital_selection.html
├── how_it_works.html
├── ohc_complete_intake.html
├── ohc_visit_form.html
├── payment_page.html
├── public_home.html
├── referral_page.html
├── reports_page.html
└── analytics_pdf_fallback.html

myproject/templates/registration/
└── login.html
```

**Command:**
```bash
rm -rf myproject/templates/frontend myproject/templates/registration/login.html
```

---

### Step 2: Remove Old Static Files

**Files to Delete:**
```
myproject/static/frontend/
├── css/portal.css
└── js/portal.js
```

**Command:**
```bash
rm -rf myproject/static/frontend
```

---

### Step 3: Remove Template-Rendering Views from `reports/views.py`

**Views to Remove:**
```python
# Remove these classes:
- PublicLandingView (TemplateView)
- PublicHowItWorksView (TemplateView)
- FrontendBaseView (LoginRequiredMixin, TemplateView)
- DashboardView (FrontendBaseView)
- OHCVisitFormPageView (FrontendBaseView)
- DiagnosisEntryPageView (FrontendBaseView)
- CompleteOHCIntakePageView (FrontendBaseView)
- ReferralPageView (FrontendBaseView)
- HospitalSelectionPageView (FrontendBaseView)
- ReportsPageView (FrontendBaseView)
- EmployeeHealthHistoryPageView (FrontendBaseView)
- DiseaseTrendsPageView (FrontendBaseView)
- DepartmentHealthStatsPageView (FrontendBaseView)
- PaymentPageView (FrontendBaseView)
```

**Views to Keep:**
```python
# Keep these (API views):
- EmployeeHealthHistoryAPIView (APIView)
- DiseaseTrendsAPIView (APIView)
- DepartmentHealthStatsAPIView (APIView)
- NotificationListAPIView (APIView)
- AuditLogListAPIView (APIView)
- RunAutoAlertsAPIView (APIView)

# Keep these (Export views):
- EmployeeHealthHistoryExcelExportView (LoginRequiredMixin, TemplateView)
- DepartmentHealthStatsExcelExportView (LoginRequiredMixin, TemplateView)
- AnalyticsPDFExportView (LoginRequiredMixin, TemplateView)
```

**Imports to Remove:**
```python
# Remove these imports if only used by template views:
from django.views.generic import TemplateView
from django.template.loader import render_to_string
```

---

### Step 4: Remove Template URL Patterns from `reports/urls.py`

**URL Patterns to Remove:**
```python
urlpatterns = [
    # Remove these:
    path("", PublicLandingView.as_view(), name="public-home"),
    path("how-it-works/", PublicHowItWorksView.as_view(), name="how-it-works"),
    path("dashboard/", DashboardView.as_view(), name="dashboard-home"),
    path("ohc/visit-form/", OHCVisitFormPageView.as_view(), name="ohc-visit-form"),
    path("ohc/diagnosis-entry/", DiagnosisEntryPageView.as_view(), name="diagnosis-entry"),
    path("ohc/complete-intake/", CompleteOHCIntakePageView.as_view(), name="complete-ohc-intake-page"),
    path("ahc/referrals/", ReferralPageView.as_view(), name="referral-page"),
    path("ahc/hospital-selection/", HospitalSelectionPageView.as_view(), name="hospital-selection"),
    path("reports/medical/", ReportsPageView.as_view(), name="reports-page"),
    path("reports/employee-history/", EmployeeHealthHistoryPageView.as_view(), name="employee-health-history-page"),
    path("reports/disease-trends/", DiseaseTrendsPageView.as_view(), name="disease-trends-page"),
    path("reports/department-stats/", DepartmentHealthStatsPageView.as_view(), name="department-health-stats-page"),
    path("payments/", PaymentPageView.as_view(), name="payment-page"),

    # Keep these (API and export):
    path("api/reports/employee-health-history/", EmployeeHealthHistoryAPIView.as_view(), name="employee-health-history-api"),
    path("api/reports/disease-trends/", DiseaseTrendsAPIView.as_view(), name="disease-trends-api"),
    path("api/reports/department-health-stats/", DepartmentHealthStatsAPIView.as_view(), name="department-health-stats-api"),
    path("api/reports/notifications/", NotificationListAPIView.as_view(), name="notifications-api"),
    path("api/reports/audit-logs/", AuditLogListAPIView.as_view(), name="audit-logs-api"),
    path("api/reports/run-auto-alerts/", RunAutoAlertsAPIView.as_view(), name="run-auto-alerts-api"),
    path("exports/employee-health-history.csv", EmployeeHealthHistoryExcelExportView.as_view(), name="employee-history-export"),
    path("exports/department-health-stats.csv", DepartmentHealthStatsExcelExportView.as_view(), name="department-stats-export"),
    path("exports/analytics-summary.pdf", AnalyticsPDFExportView.as_view(), name="analytics-pdf-export"),
]
```

**Imports to Remove:**
```python
# Remove these imports:
from reports.views import (
    # Keep: AnalyticsPDFExportView, AuditLogListAPIView, etc.
    # Remove:
    CompleteOHCIntakePageView,
    DashboardView,
    DepartmentHealthStatsPageView,
    DiagnosisEntryPageView,
    DiseaseTrendsPageView,
    EmployeeHealthHistoryPageView,
    HospitalSelectionPageView,
    NotificationListAPIView,  # Keep this one
    OHCVisitFormPageView,
    PaymentPageView,
    PublicHowItWorksView,
    PublicLandingView,
    ReferralPageView,
    ReportsPageView,
    RunAutoAlertsAPIView,  # Keep this one
)
```

---

### Step 5: Update Auth Settings in `myproject/settings.py`

**Before:**
```python
LOGIN_URL = '/accounts/login/'
LOGIN_REDIRECT_URL = '/dashboard/'
LOGOUT_REDIRECT_URL = '/'
```

**After:**
```python
LOGIN_URL = '/login'
LOGIN_REDIRECT_URL = '/dashboard'
LOGOUT_REDIRECT_URL = '/'  # or '/login' if you prefer
```

---

### Step 6: Remove Django Auth URL Include (Optional)

**File:** `myproject/myproject/urls.py`

**Before:**
```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('django.contrib.auth.urls')),  # Remove this line
    # ... other URLs
]
```

**After:**
```python
urlpatterns = [
    path('admin/', admin.site.urls),
    # accounts/ URLs removed - React handles auth
    # ... other URLs
]
```

**Note:** Only remove this if Django admin doesn't need the auth URLs. Admin typically uses its own login flow at `/admin/login/`.

---

## Verification Steps

### 1. Verify API Endpoints

```bash
# Test authentication
curl -X POST http://127.0.0.1:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_test","password":"Test@12345"}'

# Test protected endpoint
curl -X GET http://127.0.0.1:8000/api/accounts/me/ \
  -H "Authorization: Bearer <token>"
```

### 2. Verify Export Endpoints

```bash
# Test CSV export
curl -X GET http://127.0.0.1:8000/exports/department-health-stats.csv \
  -H "Authorization: Bearer <token>" \
  --output test.csv

# Test PDF export
curl -X GET http://127.0.0.1:8000/exports/analytics-summary.pdf \
  -H "Authorization: Bearer <token>" \
  --output test.pdf
```

### 3. Verify Django Admin

```bash
# Navigate to http://127.0.0.1:8000/admin/ in browser
# Login with superuser credentials
# Verify all admin models are accessible
```

### 4. Verify React Frontend

```bash
# Start React dev server (if running separately)
cd frontend
npm run dev

# Or navigate to the served React app
# Open http://localhost:5173/ in browser
# Test login with: admin_test / Test@12345
# Navigate through all pages
# Verify no console errors
```

---

## Rollback Plan

If issues occur after cleanup:

1. **Restore files from git:**
   ```bash
   git checkout -- myproject/templates/ myproject/static/frontend/
   git checkout -- myproject/reports/views.py myproject/reports/urls.py
   git checkout -- myproject/myproject/settings.py myproject/myproject/urls.py
   ```

2. **Restart Django server**

3. **Verify old routes work**

---

## Next Steps

1. Review this design document
2. Create implementation branch
3. Execute cleanup steps
4. Run verification tests
5. Commit changes

**Phase 3 Output:** `docs/design/architecture.md`

**✅ Phase 3 done. Continue to Phase 4 — Development? (yes/no)**

Run `/workflow-continue` to proceed.
