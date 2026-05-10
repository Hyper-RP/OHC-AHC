# Phase 2: Requirements — QA Test Cases

**Project:** OHC-AHC React Frontend — Comprehensive QA
**Date:** 2026-05-09
**Status:** Phase 2 Complete

---

## Progress Bar
```
[████████████████████████████████████████████████████] Phase 1: Planning (Complete)
[████████████████████████████████████████████████████] Phase 2: Requirements (Current)
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 3: Design
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 4: Development
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 5: Testing
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 6: Deployment
```

---

## Test Case Inventory

Total new test cases: **~170 tests across 17 new test files**
Combined with existing 108 tests = **~278 total tests**

---

## GROUP 1: Services (P0) — 5 files, ~60 tests

### 1.1 `services/__tests__/api.test.ts` (~15 tests)

**File under test:** `services/api.ts`

| ID | Test Case | Type |
|----|-----------|------|
| API-01 | Creates axios instance with correct baseURL | Config |
| API-02 | Sets Content-Type to application/json | Config |
| API-03 | Sets timeout to 30000ms | Config |
| API-04 | Request interceptor attaches Bearer token from localStorage | Interceptor |
| API-05 | Request interceptor skips auth header when no token | Interceptor |
| API-06 | Response interceptor passes through successful responses | Interceptor |
| API-07 | Response interceptor attempts token refresh on 401 | Interceptor |
| API-08 | Response interceptor retries original request after refresh | Interceptor |
| API-09 | Response interceptor clears tokens and redirects on refresh failure | Interceptor |
| API-10 | Response interceptor does not retry if _retry is already true | Interceptor |
| API-11 | handleApiError extracts `detail` from error response | Error |
| API-12 | handleApiError extracts first field error from validation errors | Error |
| API-13 | handleApiError falls back to error.message | Error |
| API-14 | handleApiError returns default message for non-axios errors | Error |
| API-15 | Response interceptor rejects non-401 errors directly | Interceptor |

### 1.2 `services/__tests__/ohc.test.ts` (~12 tests)

**File under test:** `services/ohc.ts`

| ID | Test Case | Type |
|----|-----------|------|
| OHC-01 | listVisits calls GET /ohc/visits/ | API call |
| OHC-02 | listVisits passes filter params correctly | API call |
| OHC-03 | listVisits throws on API error | Error |
| OHC-04 | getVisit calls GET /ohc/visits/{uuid}/ | API call |
| OHC-05 | getVisit throws on API error | Error |
| OHC-06 | createVisit calls POST /ohc/visits/ with data | API call |
| OHC-07 | createVisit throws on API error | Error |
| OHC-08 | createDiagnosis calls POST /ohc/diagnosis-prescriptions/ | API call |
| OHC-09 | createDiagnosis throws on API error | Error |
| OHC-10 | getVisitDiagnoses calls GET /ohc/visits/{uuid}/diagnoses/ | API call |
| OHC-11 | getVisitPrescriptions calls GET /ohc/visits/{uuid}/prescriptions/ | API call |
| OHC-12 | getVisitPrescriptions throws on API error | Error |

### 1.3 `services/__tests__/ahc.test.ts` (~12 tests)

**File under test:** `services/ahc.ts`

| ID | Test Case | Type |
|----|-----------|------|
| AHC-01 | listHospitals calls GET /ahc/hospitals/ | API call |
| AHC-02 | listHospitals passes filter params | API call |
| AHC-03 | listHospitals throws on error | Error |
| AHC-04 | getHospital calls GET /ahc/hospitals/{uuid}/ | API call |
| AHC-05 | listReferrals calls GET /ahc/referrals/ | API call |
| AHC-06 | listReferrals passes filter params | API call |
| AHC-07 | getReferral calls GET /ahc/referrals/{uuid}/ | API call |
| AHC-08 | createReferral calls POST /ahc/referrals/ with data | API call |
| AHC-09 | createReferral throws on error | Error |
| AHC-10 | updateReferralHospital calls PATCH /ahc/referrals/{uuid}/ | API call |
| AHC-11 | updateReferralHospital sends hospital uuid | API call |
| AHC-12 | updateReferralHospital throws on error | Error |

### 1.4 `services/__tests__/payments.test.ts` (~8 tests)

**File under test:** `services/payments.ts`

| ID | Test Case | Type |
|----|-----------|------|
| PAY-01 | listInvoices calls GET /payments/invoices/ | API call |
| PAY-02 | listInvoices passes filter params | API call |
| PAY-03 | listInvoices throws on error | Error |
| PAY-04 | getInvoice calls GET /payments/invoices/{uuid}/ | API call |
| PAY-05 | createPayment calls POST /payments/payments/ with data | API call |
| PAY-06 | createPayment throws on error | Error |
| PAY-07 | getInvoicePayments calls GET /payments/invoices/{uuid}/payments/ | API call |
| PAY-08 | getInvoicePayments throws on error | Error |

### 1.5 `services/__tests__/reports.test.ts` (~14 tests)

**File under test:** `services/reports.ts`

| ID | Test Case | Type |
|----|-----------|------|
| RPT-01 | getEmployeeHealthHistory calls correct endpoint with params | API call |
| RPT-02 | getEmployeeHealthHistory passes date range params | API call |
| RPT-03 | getDiseaseTrends calls with period param | API call |
| RPT-04 | getDiseaseTrends passes optional severity filter | API call |
| RPT-05 | getDepartmentHealthStats calls with period param | API call |
| RPT-06 | getDepartmentHealthStats passes optional department filter | API call |
| RPT-07 | exportEmployeeHealthHistory returns blob with responseType blob | Export |
| RPT-08 | exportEmployeeHealthHistory passes date range params | Export |
| RPT-09 | exportDepartmentHealthStats returns blob | Export |
| RPT-10 | exportDepartmentHealthStats passes department filter | Export |
| RPT-11 | exportAnalyticsSummary calls with period and report type | Export |
| RPT-12 | exportAnalyticsSummary defaults reportType to 'summary' | Export |
| RPT-13 | getDashboardStats calls /reports/dashboard-home/ | API call |
| RPT-14 | All report functions throw on API error | Error |

---

## GROUP 2: Layout Components (P1) — 3 files, ~30 tests

### 2.1 `components/layout/__tests__/ProtectedRoute.test.tsx` (~6 tests)

**File under test:** `components/layout/ProtectedRoute.tsx`

| ID | Test Case | Type |
|----|-----------|------|
| PR-01 | Shows loading spinner when auth is loading | Render |
| PR-02 | Renders children when user is authenticated | Render |
| PR-03 | Redirects to /login when user is not authenticated | Redirect |
| PR-04 | Passes current location in redirect state | Redirect |
| PR-05 | Uses `replace` on redirect | Redirect |
| PR-06 | Re-renders when auth state changes | Reactivity |

### 2.2 `components/layout/__tests__/Sidebar.test.tsx` (~12 tests)

**File under test:** `components/layout/Sidebar.tsx`

| ID | Test Case | Type |
|----|-----------|------|
| SB-01 | Renders null when no user | Render |
| SB-02 | Renders brand section with OHC and title | Render |
| SB-03 | Displays user full name in footer | Render |
| SB-04 | Displays user role chip | Render |
| SB-05 | Renders nav items for ADMIN role (all 11 items) | Role-based |
| SB-06 | Renders nav items for NURSE role (correct subset) | Role-based |
| SB-07 | Renders nav items for EMPLOYEE role (no items) | Role-based |
| SB-08 | Renders nav items for HR role (correct subset) | Role-based |
| SB-09 | Each nav item links to correct URL | Navigation |
| SB-10 | Active nav item has active CSS class | Active state |
| SB-11 | Logout button calls logout function | Interaction |
| SB-12 | Accepts and applies className prop | Props |

### 2.3 `components/layout/__tests__/Header.test.tsx` (~12 tests)

**File under test:** `components/layout/Header.tsx`

| ID | Test Case | Type |
|----|-----------|------|
| HD-01 | Renders title when provided | Render |
| HD-02 | Renders subtitle when provided | Render |
| HD-03 | Does not render title/subtitle when not provided | Render |
| HD-04 | Renders actions slot | Render |
| HD-05 | Renders breadcrumb from current path | Navigation |
| HD-06 | Breadcrumb Home button navigates to /dashboard | Navigation |
| HD-07 | Last breadcrumb item is not clickable | Navigation |
| HD-08 | Displays visitCount stat | Stats |
| HD-09 | Displays referralCount stat | Stats |
| HD-10 | Displays pendingInvoices stat | Stats |
| HD-11 | Hides stats section when stats not provided | Stats |
| HD-12 | Accepts and applies className prop | Props |

---

## GROUP 3: Context (P1) — 1 file, ~10 tests

### 3.1 `contexts/__tests__/SnackbarContext.test.tsx` (~10 tests)

**File under test:** `contexts/SnackbarContext.tsx`

| ID | Test Case | Type |
|----|-----------|------|
| SN-01 | Provides show and close functions | Context API |
| SN-02 | show() sets currentMessage with correct severity | Behavior |
| SN-03 | show() sets isOpen to true | Behavior |
| SN-04 | show() defaults severity to 'info' | Default |
| SN-05 | close() sets isOpen to false | Behavior |
| SN-06 | Auto-dismisses after duration (default 4000ms) | Timer |
| SN-07 | Replaces current message when show() called again | Behavior |
| SN-08 | Clears timeout on manual close | Timer |
| SN-09 | useSnackbar throws if used outside provider | Error |
| SN-10 | Custom duration is respected | Timer |

---

## GROUP 4: Utils (P1) — 2 files, ~30 tests

### 4.1 `utils/__tests__/helpers.test.ts` (~20 tests)

**File under test:** `utils/helpers.ts`

| ID | Test Case | Type |
|----|-----------|------|
| HLP-01 | formatDate with 'short' format | Formatting |
| HLP-02 | formatDate with 'long' format | Formatting |
| HLP-03 | formatDate with 'time' format | Formatting |
| HLP-04 | formatDate returns 'Invalid Date' for bad input | Error |
| HLP-05 | getRelativeTime returns 'Just now' for recent | Formatting |
| HLP-06 | getRelativeTime returns minutes/hours/days correctly | Formatting |
| HLP-07 | formatNumber with commas | Formatting |
| HLP-08 | formatCurrency in INR | Formatting |
| HLP-09 | capitalize first letter | String |
| HLP-10 | toTitleCase full string | String |
| HLP-11 | snakeToCamel conversion | String |
| HLP-12 | camelToSnake conversion | String |
| HLP-13 | truncate within limit returns original | String |
| HLP-14 | truncate beyond limit adds suffix | String |
| HLP-15 | debounce only fires after delay | Async |
| HLP-16 | deepClone creates independent copy | Object |
| HLP-17 | deepEqual returns true for equal objects | Object |
| HLP-18 | downloadFile creates and clicks link | DOM |
| HLP-19 | getInitials from single name | String |
| HLP-20 | getInitials from full name | String |

### 4.2 `utils/__tests__/navigation.test.ts` (~10 tests)

**File under test:** `utils/navigation.ts`

| ID | Test Case | Type |
|----|-----------|------|
| NAV-01 | getNavItemsForRole returns all items for ADMIN | Role |
| NAV-02 | getNavItemsForRole returns correct items for NURSE | Role |
| NAV-03 | getNavItemsForRole returns correct items for HR | Role |
| NAV-04 | getNavItemsForRole returns correct items for DOCTOR | Role |
| NAV-05 | getNavItemsForRole returns correct items for EHS | Role |
| NAV-06 | getNavItemsForRole returns correct items for KAM | Role |
| NAV-07 | getNavItemsForRole returns empty for EMPLOYEE | Role |
| NAV-08 | hasAccessToRoute returns true for valid role/url | Access |
| NAV-09 | hasAccessToRoute returns false for invalid role/url | Access |
| NAV-10 | hasAccessToRoute returns false for unknown URL | Access |

---

## GROUP 5: Page Components (P0) — 6 files, ~40 tests

### 5.1 `components/pages/__tests__/Login.test.tsx` (~10 tests)

**File under test:** `components/pages/Login.tsx`

| ID | Test Case | Type |
|----|-----------|------|
| LGN-01 | Renders login form with username and password fields | Render |
| LGN-02 | Renders Sign In button | Render |
| LGN-03 | Renders OHC-AHC branding | Render |
| LGN-04 | Shows error when submitting empty fields | Validation |
| LGN-05 | Calls login() with username/password on submit | Interaction |
| LGN-06 | Shows loading state during login | Async |
| LGN-07 | Navigates to /dashboard on successful login | Navigation |
| LGN-08 | Navigates to `from` location after login | Navigation |
| LGN-09 | Displays error message on login failure | Error |
| LGN-10 | Shows snackbar on success/failure | Notification |

### 5.2 `components/pages/__tests__/Dashboard.test.tsx` (~8 tests)

**File under test:** `components/pages/Dashboard.tsx`

| ID | Test Case | Type |
|----|-----------|------|
| DSH-01 | Shows loading spinner initially | Render |
| DSH-02 | Renders welcome message with user's first name | Render |
| DSH-03 | Renders all 6 quick action cards | Render |
| DSH-04 | Quick action links navigate to correct routes | Navigation |
| DSH-05 | Renders 3 key insight cards | Render |
| DSH-06 | Renders recent activity section | Render |
| DSH-07 | Header shows stats (visits, referrals, pending) | Render |
| DSH-08 | View All button links to /reports/medical | Navigation |

### 5.3 `components/pages/__tests__/PublicHome.test.tsx` (~6 tests)

**File under test:** `components/pages/PublicHome.tsx`

| ID | Test Case | Type |
|----|-----------|------|
| PH-01 | Renders hero section with title and description | Render |
| PH-02 | Renders 4 stat cards with metrics | Render |
| PH-03 | Renders 6 feature cards | Render |
| PH-04 | Sign In button links to /login | Navigation |
| PH-05 | How It Works button links to /how-it-works | Navigation |
| PH-06 | Renders footer with copyright | Render |

### 5.4 `components/pages/__tests__/DepartmentStats.test.tsx` (~8 tests)

**File under test:** `components/pages/DepartmentStats.tsx`

| ID | Test Case | Type |
|----|-----------|------|
| DS-01 | Shows loading state initially | Render |
| DS-02 | Fetches department stats on mount | API |
| DS-03 | Renders summary cards (departments, employees, visits, referrals) | Render |
| DS-04 | Renders department cards with stats | Render |
| DS-05 | Period selector changes period and refetches | Interaction |
| DS-06 | Export CSV button triggers download | Export |
| DS-07 | Shows alert on API failure | Error |
| DS-08 | Shows alert on export failure | Error |

### 5.5 `components/pages/__tests__/DiseaseTrends.test.tsx` (~6 tests)

**File under test:** `components/pages/DiseaseTrends.tsx`

| ID | Test Case | Type |
|----|-----------|------|
| DT-01 | Shows loading state initially | Render |
| DT-02 | Fetches disease trends on mount | API |
| DT-03 | Renders trend items with percentages | Render |
| DT-04 | Renders severity breakdown | Render |
| DT-05 | Period selector refetches data | Interaction |
| DT-06 | Shows error on API failure | Error |

### 5.6 `components/pages/__tests__/ReportsPage.test.tsx` (~4 tests)

**File under test:** `components/pages/ReportsPage.tsx`

| ID | Test Case | Type |
|----|-----------|------|
| RP-01 | Renders report navigation links | Render |
| RP-02 | Links point to correct report routes | Navigation |
| RP-03 | Renders Header component | Render |
| RP-04 | Renders all report category cards | Render |

---

## Test Count Summary

| Group | Files | Tests |
|-------|-------|-------|
| Services (P0) | 5 | ~61 |
| Layout Components (P1) | 3 | ~30 |
| Context (P1) | 1 | ~10 |
| Utils (P1) | 2 | ~30 |
| Page Components (P0) | 6 | ~42 |
| **New Total** | **17** | **~173** |
| Existing Tests | 8 | 108 |
| **Grand Total** | **25** | **~281** |

---

## Acceptance Criteria

1. All 281+ tests pass with `npm run test:run`
2. No existing tests broken by new additions
3. Coverage ≥ 80% statements when `npm run test:coverage` runs
4. Every service function has success + error test cases
5. Every page component has render + interaction tests
6. Export flows have blob download verification

---

**Phase 2 Output:** `docs/testing/qa-test-cases.md`

**Next:** Phase 3 — Design test architecture, shared utilities, and mock strategy
