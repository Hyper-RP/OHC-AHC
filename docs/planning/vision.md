# Phase 1: Planning — Remove Python Frontend Dependencies

**Project:** OHC-AHC — Remove Django Template Frontend Dependencies
**Date:** 2026-05-08
**Status:** In Progress

---

## Progress Bar
```
[████████████████████████████████████████████████████] Phase 1: Planning (In Progress)
[████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 2: Requirements
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 3: Design
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 4: Development
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 5: Testing
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 6: Deployment
```

---

## Vision Statement

Remove all Django template-based frontend dependencies now that the React application is fully functional. The Django backend should serve **only as a REST API**, while the React frontend handles all UI rendering, routing, and authentication.

---

## Context

The OHC-AHC project has been migrated from Django templates to a React.js SPA. However, the Django backend still contains:
- 15+ Django template files in `templates/frontend/`
- 13 template-rendering views in `reports/views.py`
- Old static files (CSS/JS) for the Python frontend
- URL patterns that serve these templates
- Auth redirect settings pointing to Django routes

These are no longer needed and should be removed to:
1. Reduce codebase complexity
2. Eliminate maintenance overhead
3. Clarify the API-only architecture
4. Prevent confusion between old and new frontends

---

## Python Frontend Dependencies Found

### 1. Django Templates (16 files)

```
myproject/templates/
├── frontend/
│   ├── base.html              # Base template with navigation
│   ├── dashboard.html         # Dashboard page
│   ├── department_health_stats.html
│   ├── diagnosis_entry.html
│   ├── disease_trends.html
│   ├── employee_health_history.html
│   ├── hospital_selection.html
│   ├── how_it_works.html      # Public info page
│   ├── ohc_complete_intake.html
│   ├── ohc_visit_form.html
│   ├── payment_page.html
│   ├── public_home.html       # Landing page
│   ├── referral_page.html
│   ├── reports_page.html
│   └── analytics_pdf_fallback.html
└── registration/
    └── login.html             # Old Django login page
```

### 2. Django Views Rendering Templates (in `reports/views.py`)

| View Class | URL Route | Template | Purpose |
|------------|-----------|----------|---------|
| `PublicLandingView` | `/` | `public_home.html` | Public landing page |
| `PublicHowItWorksView` | `/how-it-works/` | `how_it_works.html` | How it works page |
| `DashboardView` | `/dashboard/` | `dashboard.html` | Main dashboard |
| `OHCVisitFormPageView` | `/ohc/visit-form/` | `ohc_visit_form.html` | OHC visit form |
| `DiagnosisEntryPageView` | `/ohc/diagnosis-entry/` | `diagnosis_entry.html` | Diagnosis entry |
| `CompleteOHCIntakePageView` | `/ohc/complete-intake/` | `ohc_complete_intake.html` | Complete intake |
| `ReferralPageView` | `/ahc/referrals/` | `referral_page.html` | Referral page |
| `HospitalSelectionPageView` | `/ahc/hospital-selection/` | `hospital_selection.html` | Hospital selection |
| `ReportsPageView` | `/reports/medical/` | `reports_page.html` | Reports page |
| `EmployeeHealthHistoryPageView` | `/reports/employee-history/` | `employee_health_history.html` | Health history |
| `DiseaseTrendsPageView` | `/reports/disease-trends/` | `disease_trends.html` | Disease trends |
| `DepartmentHealthStatsPageView` | `/reports/department-stats/` | `department_health_stats.html` | Department stats |
| `PaymentPageView` | `/payments/` | `payment_page.html` | Payment page |

### 3. Static Files (Old Python Frontend)

```
myproject/static/frontend/
├── css/portal.css     # ~1,349 lines of CSS
└── js/portal.js       # JavaScript for vitals JSON aggregation
```

### 4. Django URL Patterns (Non-API Routes to Remove)

From `reports/urls.py`:
```python
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
```

From `myproject/urls.py`:
```python
path('accounts/', include('django.contrib.auth.urls')),  # Django auth templates
```

### 5. Settings Dependencies

```python
LOGIN_URL = '/accounts/login/'        # Points to Django login
LOGIN_REDIRECT_URL = '/dashboard/'    # Points to Django dashboard
LOGOUT_REDIRECT_URL = '/'             # Points to Django home
```

---

## Top 3 Risks

### Risk 1: Broken URLs After Removal
**Severity:** High
**Impact:** Users with bookmarks or external links to old Django routes will get 404 errors.

**Mitigation:**
- Set up redirects from old Django routes to React equivalents (if they exist)
- Or return 410 Gone with a message to use the new React app

### Risk 2: PDF Export Functionality
**Severity:** Medium
**Impact:** `AnalyticsPDFExportView` uses Django template rendering for PDF generation.

**Mitigation:**
- Keep the PDF export view but refactor to use API data instead of template context
- Or implement PDF generation in the React frontend

### Risk 3: Django Admin and Auth
**Severity:** Low
**Impact:** Django admin and session-based auth may depend on some templates.

**Mitigation:**
- Keep Django admin templates (they're in `django/contrib/admin/templates/`)
- Keep auth-related URL patterns but redirect to React login
- Ensure JWT authentication is the primary auth mechanism

---

## Must-Have vs Nice-to-Have

### Must-Have (Required for Complete Cleanup)

- [ ] Remove all `reports/views.py` template-based views (13 views)
- [ ] Remove template URL patterns from `reports/urls.py` (13 routes)
- [ ] Remove `templates/frontend/` directory (15 HTML files)
- [ ] Remove `templates/registration/login.html` if not used by admin
- [ ] Remove `static/frontend/` directory (old CSS/JS)
- [ ] Update `settings.py` auth redirects to point to React routes
- [ ] Keep API endpoints unchanged (these are used by React)
- [ ] Keep export endpoints (CSV/PDF) as they're used by React

### Nice-to-Have (Further Cleanup)

- [ ] Add redirect middleware for old Django routes → React routes
- [ ] Refactor `AnalyticsPDFExportView` to be API-only
- [ ] Document the new API-only architecture
- [ ] Update any documentation that references the old frontend

---

## Recommended Approach

1. **Phase 1: Template Removal** (Quick, Safe)
   - Delete `static/frontend/` directory
   - Delete `templates/frontend/` directory
   - Delete `templates/registration/login.html` (if unused)

2. **Phase 2: View Cleanup** (Medium effort)
   - Remove template-based views from `reports/views.py`
   - Keep only API views (`APIView` subclasses) and export views

3. **Phase 3: URL Update** (Quick)
   - Remove template URL patterns from `reports/urls.py`
   - Optionally add redirects for old routes

4. **Phase 4: Settings Update** (Quick)
   - Change `LOGIN_URL` to `/login` (React route)
   - Change `LOGIN_REDIRECT_URL` to `/dashboard` (React route)
   - Keep `LOGOUT_REDIRECT_URL` as `/` or update to `/login`

---

## Questions for User

1. Should we set up redirects from old Django routes to React routes, or return 404/410?
2. Is PDF export functionality still needed? If so, should it remain server-side or move to React?
3. Are there any external systems or bookmarks that link to the old Django routes?
4. Should we keep the `/accounts/` URL patterns for Django admin, or disable them entirely?

---

## Success Criteria

- [ ] All Django template files removed
- [ ] All template-rendering views removed
- [ ] All template URL patterns removed
- [ ] Settings updated to use React routes
- [ ] API endpoints still functional
- [ ] React app still works correctly
- [ ] No broken references remaining

---

## Next Steps

After approval, proceed to Phase 2: Requirements Gathering to create a detailed task list for the removal process.

**✅ Phase 1 complete. Shall I continue to Phase 2 — Requirements Gathering? (yes/no)**
