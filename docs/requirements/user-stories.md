# Phase 2: Requirements — Remove Python Frontend Dependencies

**Project:** OHC-AHC — Remove Django Template Frontend Dependencies
**Date:** 2026-05-08
**Status:** In Progress

---

## Progress Bar
```
[████████████████████████████████████████████████████] Phase 1: Planning (Completed)
[████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 2: Requirements (In Progress)
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 3: Design
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 4: Development
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 5: Testing
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 6: Deployment
```

---

## Overview

This document breaks down the task of removing Django template-based frontend dependencies into actionable user stories with clear acceptance criteria.

**Scope:** Remove all server-side template rendering while preserving API endpoints, export functionality, and Django admin.

**What Stays:**
- All API endpoints (`/api/*`)
- Export endpoints (CSV, PDF)
- Django admin interface
- JWT authentication

**What Goes:**
- Django template files (`templates/frontend/`)
- Template-rendering views (13 views)
- Template URL patterns (13 routes)
- Old static files (CSS/JS)
- Auth redirect settings pointing to Django routes

---

## User Stories

### User Story 1: Remove Django Template Files

**As a:** Developer
**I want to:** Remove all Django template files from the project
**So that:** The codebase is cleaner and there's no confusion between old and new frontends

**Acceptance Criteria:**
- [ ] Directory `myproject/templates/frontend/` is deleted (15+ HTML files)
- [ ] File `myproject/templates/registration/login.html` is deleted (if unused by admin)
- [ ] No references to these templates exist in the codebase
- [ ] Git confirms only these files are removed

**Files Affected:**
- `myproject/templates/frontend/base.html`
- `myproject/templates/frontend/dashboard.html`
- `myproject/templates/frontend/department_health_stats.html`
- `myproject/templates/frontend/diagnosis_entry.html`
- `myproject/templates/frontend/disease_trends.html`
- `myproject/templates/frontend/employee_health_history.html`
- `myproject/templates/frontend/hospital_selection.html`
- `myproject/templates/frontend/how_it_works.html`
- `myproject/templates/frontend/ohc_complete_intake.html`
- `myproject/templates/frontend/ohc_visit_form.html`
- `myproject/templates/frontend/payment_page.html`
- `myproject/templates/frontend/public_home.html`
- `myproject/templates/frontend/referral_page.html`
- `myproject/templates/frontend/reports_page.html`
- `myproject/templates/frontend/analytics_pdf_fallback.html`
- `myproject/templates/registration/login.html`

**Priority:** High

---

### User Story 2: Remove Old Static Files

**As a:** Developer
**I want to:** Remove the old Python frontend static files
**So that:** There's no unused CSS/JS files taking up space

**Acceptance Criteria:**
- [ ] Directory `myproject/static/frontend/css/` is deleted (portal.css)
- [ ] Directory `myproject/static/frontend/js/` is deleted (portal.js)
- [ ] No references to these files exist in the codebase
- [ ] Django still serves the React build from `myproject/static/react/`

**Files Affected:**
- `myproject/static/frontend/css/portal.css`
- `myproject/static/frontend/js/portal.js`

**Priority:** High

---

### User Story 3: Remove Template-Rendering Views

**As a:** Developer
**I want to:** Remove all views that render Django templates
**So that:** Django serves only API responses, not HTML

**Acceptance Criteria:**
- [ ] `PublicLandingView` class removed from `reports/views.py`
- [ ] `PublicHowItWorksView` class removed from `reports/views.py`
- [ ] `FrontendBaseView` class removed from `reports/views.py`
- [ ] `DashboardView` class removed from `reports/views.py`
- [ ] `OHCVisitFormPageView` class removed from `reports/views.py`
- [ ] `DiagnosisEntryPageView` class removed from `reports/views.py`
- [ ] `CompleteOHCIntakePageView` class removed from `reports/views.py`
- [ ] `ReferralPageView` class removed from `reports/views.py`
- [ ] `HospitalSelectionPageView` class removed from `reports/views.py`
- [ ] `ReportsPageView` class removed from `reports/views.py`
- [ ] `EmployeeHealthHistoryPageView` class removed from `reports/views.py`
- [ ] `DiseaseTrendsPageView` class removed from `reports/views.py`
- [ ] `DepartmentHealthStatsPageView` class removed from `reports/views.py`
- [ ] `PaymentPageView` class removed from `reports/views.py`
- [ ] Export views (`EmployeeHealthHistoryExcelExportView`, `DepartmentHealthStatsExcelExportView`, `AnalyticsPDFExportView`) are **kept**
- [ ] API views (all `APIView` subclasses) are **kept**
- [ ] No import errors after removal

**Priority:** High

---

### User Story 4: Remove Template URL Patterns

**As a:** Developer
**I want to:** Remove URL patterns that serve Django templates
**So that:** The URL configuration only contains API routes

**Acceptance Criteria:**
- [ ] Route `/` removed from `reports/urls.py` (was: `PublicLandingView`)
- [ ] Route `/how-it-works/` removed from `reports/urls.py` (was: `PublicHowItWorksView`)
- [ ] Route `/dashboard/` removed from `reports/urls.py` (was: `DashboardView`)
- [ ] Route `/ohc/visit-form/` removed from `reports/urls.py` (was: `OHCVisitFormPageView`)
- [ ] Route `/ohc/diagnosis-entry/` removed from `reports/urls.py` (was: `DiagnosisEntryPageView`)
- [ ] Route `/ohc/complete-intake/` removed from `reports/urls.py` (was: `CompleteOHCIntakePageView`)
- [ ] Route `/ahc/referrals/` removed from `reports/urls.py` (was: `ReferralPageView`)
- [ ] Route `/ahc/hospital-selection/` removed from `reports/urls.py` (was: `HospitalSelectionPageView`)
- [ ] Route `/reports/medical/` removed from `reports/urls.py` (was: `ReportsPageView`)
- [ ] Route `/reports/employee-history/` removed from `reports/urls.py` (was: `EmployeeHealthHistoryPageView`)
- [ ] Route `/reports/disease-trends/` removed from `reports/urls.py` (was: `DiseaseTrendsPageView`)
- [ ] Route `/reports/department-stats/` removed from `reports/urls.py` (was: `DepartmentHealthStatsPageView`)
- [ ] Route `/payments/` removed from `reports/urls.py` (was: `PaymentPageView`)
- [ ] All `/api/*` routes are **kept**
- [ ] All `/exports/*` routes are **kept**
- [ ] URL patterns referencing removed views are cleaned up
- [ ] No URL resolution errors after removal

**Priority:** High

---

### User Story 5: Update Auth Redirect Settings

**As a:** Developer
**I want to:** Update Django auth settings to point to React routes
**So that:** Login/logout flows work correctly with the React frontend

**Acceptance Criteria:**
- [ ] `LOGIN_URL` changed from `/accounts/login/` to `/login` (React route)
- [ ] `LOGIN_REDIRECT_URL` changed from `/dashboard/` to `/dashboard` (React route)
- [ ] `LOGOUT_REDIRECT_URL` changed from `/` to `/` (home - same) or `/login`
- [ ] Django admin login still works (uses different URL path)
- [ ] JWT authentication flow works correctly

**Files Affected:**
- `myproject/myproject/settings.py`

**Priority:** Medium

---

### User Story 6: Remove Django Auth URL Include

**As a:** Developer
**I want to:** Remove or modify the Django auth URL include
**So that:** The auth URLs don't conflict with React routes

**Acceptance Criteria:**
- [ ] Evaluate if `path('accounts/', include('django.contrib.auth.urls'))` is needed for Django admin
- [ ] If not needed, remove the line from `myproject/urls.py`
- [ ] If needed, ensure it doesn't conflict with React routes
- [ ] Django admin login still accessible at `/admin/login/`

**Files Affected:**
- `myproject/myproject/urls.py`

**Priority:** Low (depends on admin requirements)

---

### User Story 7: Keep API Endpoints Functional

**As a:** System
**I want to:** Ensure all API endpoints still work after cleanup
**So that:** The React frontend continues to function normally

**Acceptance Criteria:**
- [ ] `/api/auth/token/` returns JWT tokens
- [ ] `/api/auth/token/refresh/` refreshes tokens
- [ ] `/api/accounts/me/` returns current user
- [ ] `/api/ohc/*` endpoints return data
- [ ] `/api/ahc/*` endpoints return data
- [ ] `/api/payments/*` endpoints return data
- [ ] `/api/reports/*` endpoints return data
- [ ] All API endpoints respond with proper status codes
- [ ] JWT authentication works on all protected endpoints

**Priority:** Critical (Must Verify)

---

### User Story 8: Keep Export Endpoints Functional

**As a:** System
**I want to:** Ensure CSV and PDF export endpoints still work
**So that:** Users can still export reports from React

**Acceptance Criteria:**
- [ ] `/exports/employee-health-history.csv` returns CSV file
- [ ] `/exports/department-health-stats.csv` returns CSV file
- [ ] `/exports/analytics-summary.pdf` returns PDF file
- [ ] All export endpoints are accessible from React
- [ ] Export functionality works with JWT authentication

**Priority:** High

---

### User Story 9: Keep Django Admin Functional

**As a:** Administrator
**I want to:** Ensure Django admin still works after cleanup
**So that:** I can manage the system through the admin interface

**Acceptance Criteria:**
- [ ] `/admin/` loads successfully
- [ ] Admin login works
- [ ] All admin models are accessible
- [ ] Admin templates (from Django) are not affected
- [ ] Admin static files are still served

**Priority:** Medium

---

### User Story 10: Verify React Frontend Works

**As a:** User
**I want to:** Use the React application normally after cleanup
**So that:** The migration is transparent to end users

**Acceptance Criteria:**
- [ ] React app loads at root URL (`/`)
- [ ] Login page works with correct credentials
- [ ] Dashboard loads after login
- [ ] All protected routes work
- [ ] Navigation between pages works
- [ ] API calls from React succeed
- [ ] No 404 or 500 errors in browser console
- [ ] Forms submit correctly

**Priority:** Critical (Must Verify)

---

## Task Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                       Task Dependency Graph                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐                                                 │
│  │  Story 1:   │                                                 │
│  │  Remove     │──────────────────────────────────────┐        │
│  │  Templates  │                                      │        │
│  └─────────────┘                                      │        │
│                                                       │        │
│  ┌─────────────┐                                      │        │
│  │  Story 2:   │                                      │        │
│  │  Remove     │──────────────────────────────────────┼─┐      │
│  │  Static     │                                      │ │      │
│  └─────────────┘                                      │ │      │
│                                                       │ │      │
│  ┌─────────────┐    ┌─────────────┐    ┌────────────┐ │ │      │
│  │  Story 3:   │────│  Story 4:   │────│ Story 5:  │◄┼─┼──┐   │
│  │  Remove     │    │  Remove     │    │ Update     │ │ │  │   │
│  │  Views      │    │  URL        │    │ Auth       │ │ │  │   │
│  └─────────────┘    └─────────────┘    └────────────┘ │ │  │   │
│       │                  │                   │          │ │  │   │
│       │                  │                   │          │ │  │   │
│       └──────────────────┴───────────────────┴──────────┘ │  │   │
│                                                          │  │   │
│  ┌──────────────────────────────────────────────────────┘  │   │
│  │                                                           │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌────────────┐    │   │
│  │  │  Story 7:   │    │  Story 8:   │    │ Story 9:  │    │   │
│  │  │  Keep API   │    │  Keep       │    │ Keep      │    │   │
│  │  │  Endpoints  │    │  Exports    │    │ Admin     │    │   │
│  │  └─────────────┘    └─────────────┘    └────────────┘    │   │
│  │         │                   │                   │        │   │
│  │         └───────────────────┴───────────────────┘        │   │
│  │                              │                           │   │
│  │  ┌─────────────────────────────────────────────────────┘   │
│  │  │                                                         │
│  │  │  ┌─────────────┐                                        │
│  │  └─│  Story 10:  │                                        │
│  │     │  Verify     │                                        │
│  │     │  React      │                                        │
│  │     └─────────────┘                                        │
│  │                                                             │
│  └─────────────────────────────────────────────────────────────┘
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Dependencies:**
- Stories 1-6 (Cleanup) must be completed before Stories 7-10 (Verification)
- Story 10 (Verify React) depends on Stories 7-9 (Keep functionality)

---

## Priority Matrix

| Story | Priority | Estimated Time | Dependencies |
|-------|----------|----------------|--------------|
| Story 1: Remove Templates | High | 5 min | None |
| Story 2: Remove Static Files | High | 5 min | None |
| Story 3: Remove Views | High | 10 min | 1, 2 |
| Story 4: Remove URL Patterns | High | 10 min | 3 |
| Story 5: Update Auth Settings | Medium | 5 min | 4 |
| Story 6: Remove Auth URLs | Low | 10 min | 5 |
| Story 7: Verify API Endpoints | Critical | 15 min | 1-6 |
| Story 8: Verify Export Endpoints | High | 10 min | 1-6 |
| Story 9: Verify Django Admin | Medium | 10 min | 1-6 |
| Story 10: Verify React Frontend | Critical | 20 min | 7, 8, 9 |

**Total Estimated Time:** ~100 minutes (1.5 - 2 hours)

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking API endpoints | Low | High | Test all API endpoints after cleanup |
| Breaking export functionality | Low | Medium | Keep export views unchanged |
| Breaking Django admin | Low | Medium | Keep admin URLs and templates |
| React app stops working | Low | Critical | Test React app thoroughly after cleanup |
| External links broken | High | Low | Add redirects or return 410 Gone |

---

## Acceptance Checklist

**Before Cleanup:**
- [ ] All tests pass
- [ ] React app is working
- [ ] Backup of current codebase created
- [ ] Git branch created for cleanup

**After Cleanup:**
- [ ] All template files removed
- [ ] All template views removed
- [ ] All template URLs removed
- [ ] Settings updated
- [ ] API endpoints working
- [ ] Export endpoints working
- [ ] Django admin working
- [ ] React app working
- [ ] No broken references
- [ ] Git diff shows only expected changes

---

## Next Steps

1. Review and approve these user stories
2. Proceed to Phase 3: Design to create detailed implementation plan

**✅ Phase 2 done. Continue to Phase 3 — Design? (yes/no)**

Run `/workflow-continue` to proceed.
