# OHC-AHC — React Frontend to Backend Integration Checklist

**Date:** 2026-05-07
**React Frontend Status:** ✅ Complete (108/108 tests, production-ready)
**Django Backend Status:** ⏳ Unknown (needs verification)

---

## React Frontend: Complete ✅

### What's Done

| Component | Status |
|----------|--------|
| Authentication | ✅ JWT login, logout, refresh token |
| OHC Module | ✅ Visits, diagnoses, prescriptions forms |
| AHC Module | ✅ Hospital selection, referral form |
| Payments Module | ✅ Invoice list, payment form |
| Reports Module | ✅ Employee history, disease trends, department stats |
| Export Functionality | ✅ CSV and PDF exports |
| Responsive Design | ✅ Mobile, tablet, desktop |
| Accessibility | ✅ WCAG Level A compliant |
| TypeScript | ✅ Fully typed |
| Unit Tests | ✅ 108 tests passing |
| Build | ✅ Production build successful (107 KB gzipped) |
| Linting | ✅ Zero errors |

### API Endpoints Implemented (18/21)

The React frontend calls 18 out of 21 documented API endpoints:

| Module | Endpoint | Method | Status |
|--------|----------|--------|--------|
| auth | `/api/auth/token/` | POST | ✅ |
| auth | `/api/auth/token/refresh/` | POST | ✅ |
| auth | `/api/accounts/me/` | GET | ✅ |
| ohc | `/api/ohc/visits/` | GET | ✅ |
| ohc | `/api/ohc/visits/{uuid}/` | GET | ✅ |
| ohc | `/api/ohc/visits/` | POST | ✅ |
| ohc | `/api/ohc/diagnosis-prescriptions/` | POST | ✅ |
| ohc | `/api/ohc/visits/{uuid}/diagnoses/` | GET | ✅ |
| ohc | `/api/ohc/visits/{uuid}/prescriptions/` | GET | ✅ |
| ahc | `/api/ahc/hospitals/` | GET | ✅ |
| ahc | `/api/ahc/hospitals/{uuid}/` | GET | ✅ |
| ahc | `/api/ahc/referrals/` | GET | ✅ |
| ahc | `/api/ahc/referrals/{uuid}/` | GET | ✅ |
| ahc | `/api/ahc/referrals/` | POST | ✅ |
| ahc | `/api/ahc/referrals/{uuid}/` | PATCH | ✅ |
| payments | `/api/payments/invoices/` | GET | ✅ |
| payments | `/api/payments/invoices/{uuid}/` | GET | ✅ |
| payments | `/api/payments/invoices/{uuid}/payments/` | GET | ✅ |
| payments | `/api/payments/payments/` | POST | ✅ |
| reports | `/api/reports/employee-health-history/` | GET | ✅ |
| reports | `/api/reports/disease-trends/` | GET | ✅ |
| reports | `/api/reports/department-health-stats/` | GET | ✅ |
| reports | `/api/exports/employee-health-history.csv` | GET | ✅ |
| reports | `/api/exports/department-health-stats.csv` | GET | ✅ |
| reports | `/api/exports/analytics-summary.pdf` | GET | ✅ |
| reports | `/api/reports/dashboard-home/` | GET | ✅ |

---

## Missing React Frontend Features (3/21 API endpoints)

| Missing Feature | API Endpoint | Priority | Estimated Work |
|--------------|-------------|----------|----------------|
| Medical Tests List | GET `/api/ohc/medical-tests/` | Medium | 2-4 hours |
| Audit Logs Viewer | GET `/api/reports/audit-logs/` | Medium | 3-5 hours |
| Notifications Panel | GET `/api/reports/notifications/` | Medium | 2-3 hours |

---

## Django Backend: Verification Required ⏳

### Location
`../myproject/`

### Verification Checklist

- [ ] Check if Django backend is running
- [ ] Verify Django project structure (apps, models, views, urls, settings)
- [ ] Check which API endpoints are implemented in Django views
- [ ] Verify database schema matches API contract
- [ ] Check CORS configuration (allow React frontend origin)
- [ ] Verify authentication (JWT, SimpleJWT) is configured
- [ ] Check static file serving for React build output

### Django Apps to Verify

Based on React frontend API calls, verify these Django apps exist:

| Django App | Required Endpoints | Status |
|------------|---------------------|--------|
| accounts app | `/api/auth/token/`, `/api/auth/token/refresh/`, `/api/accounts/me/` | ⏳ Check |
| ohc app | All OHC endpoints (11 total) | ⏳ Check |
| ahc app | All AHC endpoints (6 total) | ⏳ Check |
| payments app | All Payments endpoints (4 total) | ⏳ Check |
| reports app | All Reports endpoints (7 total) | ⏳ Check |

### Critical Questions to Answer

1. **Does the Django backend implement all 21 API endpoints?**
   - If YES → Integration is mostly complete
   - If NO → Which endpoints are missing? Are they required?

2. **Are the 3 missing endpoints (medical tests, audit logs, notifications) needed?**
   - These are documented in the API contract but may not be MVP critical

3. **Is the backend ready for integration?**
   - Running? Configured correctly? Database populated?

---

## Decision Tree

### Scenario 1: Django Backend Fully Implements API ✅

**Action:** Test full integration immediately

1. Verify CORS allows `http://localhost:5174` (React dev server)
2. Test login flow from React frontend to Django backend
3. Verify all React pages work with real Django data
4. Add missing React features if needed
5. Deploy both backend and frontend together

### Scenario 2: Django Backend Missing Some Endpoints ⚠️

**Action:** Prioritize missing endpoints

1. Implement missing Django endpoints first
2. Add missing React frontend pages
3. Test integration
4. Deploy

### Scenario 3: Django Backend Doesn't Exist or Needs Major Work 🚨

**Action:** Backend development or alternative approach

**Option A:** Build Django backend scaffold
- Use Django REST Framework (DRF) or Django REST Framework (DRF)
- Implement all required endpoints
- Follow API contract exactly

**Option B:** Use mock backend for testing
- Create mock server returning sample data
- Verify React frontend works
- Replace with real backend later

**Option C:** Different backend technology
- If Django is abandoned, consider FastAPI, Node.js, or other framework

---

## Integration Testing Checklist

### Phase 1: Connection Test

- [ ] React frontend can reach Django backend (CORS test)
- [ ] Authentication flow works end-to-end
- [ ] GET requests return data correctly
- [ ] POST requests create resources correctly
- [ ] JWT token refresh works automatically
- [ ] 401 responses trigger token refresh
- [ ] Error messages display in React UI

### Phase 2: Feature Testing

- [ ] OHC Visit form creates visit in Django
- [ ] Diagnosis entry creates diagnosis + prescriptions
- [ ] Hospital selection loads from Django
- [ ] Referral creates referral in Django
- [ ] Payment processes invoice and creates payment
- [ ] Reports display data from Django
- [ ] CSV export downloads file from Django
- [ ] PDF export downloads file from Django

### Phase 3: Edge Cases

- [ ] Network errors handled gracefully
- [ ] Form validation works
- [ ] Empty states handled correctly
- [ ] Loading states work properly
- [ ] Concurrent requests handled correctly

---

## Next Steps

1. **Verify Django backend** - Inspect `../myproject/` to determine current state
2. **Based on findings** - Choose appropriate action path
3. **Implement** - Build missing backend or add missing React features
4. **Test** - Full integration testing
5. **Deploy** - Production deployment

---

## Team Coordination

### Who Needs to Be Involved

| Role | Responsibilities |
|-------|----------------|
| Backend Developer | Implement missing Django endpoints, CORS configuration |
| Frontend Developer | Add missing React pages (if needed) |
| DevOps Engineer | Deployment configuration, environment setup |
| QA Engineer | Integration testing, end-to-end workflows |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|-------|------------|--------|------------|
| Django backend doesn't match API contract | Medium | Use API contract as source of truth, update Django to match |
| CORS not configured | High | Configure CORS in Django settings |
| Django authentication differs | Medium | Update React auth service to match Django implementation |
| Database schema mismatch | Medium | Align Django models with API contract |

---

**Action Required:** Someone must verify the Django backend state and report back which scenario applies.

**Prepared by:** Claude Code Agent
**Date:** 2026-05-07
