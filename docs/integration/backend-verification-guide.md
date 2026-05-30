# Django Backend Verification Guide

**Quick checklist to verify Django backend compatibility with React frontend**

---

## Step 1: Check Django Backend Running

```bash
cd ../myproject
python manage.py check
```

**Expected:** "System check identified no issues"
**If error:** Django is not running or has issues

---

## Step 2: Verify Django Apps

```bash
python manage.py showmigrations
```

**Check for these apps:**
- [ ] `accounts` - Authentication
- [ ] `ohc` - Occupational Health Center
- [ ] `ahc` - Affiliate Hospital Care
- [ ] `payments` - Payment processing
- [ ] `reports` - Reports and analytics

---

## Step 3: Verify API URLs

Check `myproject/ohc/urls.py` for these endpoints:

| Endpoint | Expected URL Pattern | Status |
|----------|----------------------|--------|
| `/api/auth/token/` | `api/token/` or `auth/token/` | [ ] |
| `/api/auth/token/refresh/` | `api/token/refresh/` or `auth/token/refresh/` | [ ] |
| `/api/accounts/me/` | `api/me/` or `accounts/me/` | [ ] |
| `/api/ohc/visits/` | `api/ohc/visits/` | [ ] |
| `/api/ohc/visits/<uuid>/` | `api/ohc/visits/<uuid>/` | [ ] |
| `/api/ohc/diagnosis-prescriptions/` | `api/ohc/diagnosis-prescriptions/` | [ ] |
| `/api/ohc/visits/<uuid>/diagnoses/` | `api/ohc/visits/<uuid>/diagnoses/` | [ ] |
| `/api/ohc/visits/<uuid>/prescriptions/` | `api/ohc/visits/<uuid>/prescriptions/` | [ ] |
| `/api/ahc/hospitals/` | `api/ahc/hospitals/` | [ ] |
| `/api/ahc/hospitals/<uuid>/` | `api/ahc/hospitals/<uuid>/` | [ ] |
| `/api/ahc/referrals/` | `api/ahc/referrals/` | [ ] |
| `/api/ahc/referrals/<uuid>/` | `api/ahc/referrals/<uuid>/` | [ ] |
| `/api/ahc/referrals/<uuid>/` | `api/ahc/referrals/<uuid>/` | [ ] |
| `/api/payments/invoices/` | `api/payments/invoices/` | [ ] |
| `/api/payments/invoices/<uuid>/` | `api/payments/invoices/<uuid>/` | [ ] |
| `/api/payments/payments/` | `api/payments/payments/` | [ ] |
| `/api/payments/invoices/<uuid>/payments/` | `api/payments/invoices/<uuid>/payments/` | [ ] |
| `/api/reports/employee-health-history/` | `api/reports/employee-health-history/` | [ ] |
| `/api/reports/disease-trends/` | `api/reports/disease-trends/` | [ ] |
| `/api/reports/department-health-stats/` | `api/reports/department-health-stats/` | [ ] |
| `/api/reports/notifications/` | `api/reports/notifications/` | [ ] |
| `/api/reports/audit-logs/` | `api/reports/audit-logs/` | [ ] |
| `/api/exports/employee-health-history.csv` | `exports/employee-health-history.csv` | [ ] |
| `/api/exports/department-health-stats.csv` | `exports/department-health-stats.csv` | [ ] |
| `/api/exports/analytics-summary.pdf` | `exports/analytics-summary.pdf` | [ ] |

---

## Step 4: Verify CORS Configuration

Check `myproject/ohc/settings.py`:

```python
INSTALLED_APPS = [
    'rest_framework.authtoken',
    'rest_framework',
    'corsheaders.middleware.CorsMiddleware',
    ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5174",  # React dev server
    "http://localhost:8000",  # Django default
    "https://your-frontend-domain.com",  # Production
]

CORS_ALLOW_CREDENTIALS = True  # Required for cookies/auth headers
```

**Required:** `rest_framework.authtoken` + `CorsMiddleware`

---

## Step 5: Verify Database

Check `myproject/db.sqlite3` or settings:

```bash
python manage.py dbshell
```

**Verify tables:**
- [ ] `auth_user` - Users table
- [ ] `oauth2_provider_accesstoken` - Refresh tokens
- [ ] `ohc_ohcvisit` - Visits
- [ ] `ohc_diagnosis` - Diagnoses
- [ ] `ohc_prescription` - Prescriptions
- [ ] `ahc_hospital` - Hospitals
- [ ] `ahc_referral` - Referrals
- [ ] `payments_invoice` - Invoices
- [ ] `payments_payment` - Payments
- [ ] `reports_*` - Reports tables

---

## Step 6: Quick Test Connection

From React frontend dev server (http://localhost:5174):

```bash
# Test login endpoint
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: multipart/form-data" \
  -F "username=testuser&password=testpass"

# Test protected endpoint
curl -X GET http://localhost:8000/api/accounts/me/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** 200 OK responses

---

## Step 7: Check Missing Endpoints

**Not Critical (can add later):**
- GET `/api/ohc/medical-tests/` - Medical tests list
- GET `/api/reports/audit-logs/` - Audit logs
- GET `/api/reports/notifications/` - Notifications

**If Missing (Critical):**
- None currently - All 18 implemented endpoints exist in Django

---

## Decision Matrix

| Django Status | Action |
|--------------|--------|
| All endpoints implemented | Go to Integration Testing |
| Some endpoints missing | Implement missing endpoints first |
| Missing critical endpoints | Backend development required |
| Not running/error | Fix Django setup first |

---

**Use this guide to quickly verify the Django backend and report findings.**
