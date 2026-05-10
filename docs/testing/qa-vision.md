# Phase 1: Planning — Functional Testing & QA

**Project:** OHC-AHC React Frontend — Comprehensive QA
**Date:** 2026-05-09
**Status:** Phase 1 Complete

---

## Progress Bar
```
[████████████████████████████████████████████████████] Phase 1: Planning (Current)
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 2: Requirements
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 3: Design
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 4: Development
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 5: Testing
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 6: Deployment
```

---

## 1. Vision

Build a comprehensive, automated test suite for the OHC-AHC React frontend that:

- Ensures every page renders correctly and handles user interactions
- Validates all API integration points with mocked services
- Tests export functionality (CSV/PDF) end-to-end
- Catches regressions before they reach production
- Achieves ≥80% code coverage across the codebase

---

## 2. Current State Assessment

### Existing Test Coverage

| Layer | What's Tested | Tests | Status |
|-------|---------------|-------|--------|
| **UI Components** | Button, Card, FormInput, StatCard, Alert | 66 | ✅ All pass |
| **Contexts** | AuthContext (login, logout, refresh) | 10 | ✅ All pass |
| **Services** | auth.ts (token ops), vitals.ts (aggregation) | 35 | ✅ All pass |
| **Pages** | *None* | 0 | ❌ Missing |
| **Layout** | *None* | 0 | ❌ Missing |
| **Hooks** | *None* | 0 | ❌ Missing |
| **Integration** | *None (API mocked manually in previous coverage report)* | 0 | ❌ Missing |
| **E2E** | *None* | 0 | ❌ Missing |
| **Exports** | *None (manual verification only)* | 0 | ❌ Missing |

**Total: 108 tests passing, 8 test files**

### What's NOT Tested

1. **14 page components** — Login, Dashboard, OHCVisitForm, DiagnosisEntry, etc.
2. **3 layout components** — Sidebar, Header, PortalLayout, ProtectedRoute
3. **2 hooks** — useAuth, useFetch
4. **5 services** — api.ts, ohc.ts, ahc.ts, payments.ts, reports.ts
5. **1 context** — SnackbarContext
6. **3 form components** — OHCVisitForm, DiagnosisForm, ReferralForm
7. **Export flows** — CSV download, PDF download
8. **Routing** — Route protection, redirects, navigation

---

## 3. Scope Definition

### In Scope

| Area | Description | Priority |
|------|-------------|----------|
| Page component tests | Render, state, user interactions for all 14 pages | P0 |
| Service layer tests | API calls, error handling, response mapping | P0 |
| Export functionality | CSV/PDF download triggers and blob handling | P0 |
| Layout component tests | Sidebar nav, Header, ProtectedRoute | P1 |
| Hook tests | useAuth, useFetch | P1 |
| SnackbarContext tests | Show/hide/dismiss snackbar | P1 |
| Form component tests | Validation, submission, field interactions | P1 |
| Routing tests | Protected routes, redirects, 404 handling | P2 |
| Integration tests | Multi-component flows (login → dashboard) | P2 |

### Out of Scope (for this workflow)

- E2E browser tests (Playwright/Cypress) — separate workflow
- Visual regression testing
- Performance/load testing
- Backend API testing (already covered)

---

## 4. Success Criteria

| Metric | Target |
|--------|--------|
| Code coverage (statements) | ≥ 80% |
| Code coverage (branches) | ≥ 70% |
| Test pass rate | 100% |
| Total test count | ≥ 250 |
| Pages with tests | 14/14 |
| Services with tests | 7/7 |
| Zero regressions | Existing 108 tests still pass |

---

## 5. Phase Map (This Workflow)

| Phase | Focus | Output |
|-------|-------|--------|
| 1. Planning | Scope, coverage gaps, strategy | `docs/testing/qa-vision.md` (this file) |
| 2. Requirements | Test cases per component, acceptance criteria | `docs/testing/qa-test-cases.md` |
| 3. Design | Test architecture, utilities, mock strategy | `docs/testing/qa-test-design.md` |
| 4. Development | Write all tests | Test files in `frontend/src/` |
| 5. Testing | Run full suite, coverage report, fix failures | `docs/testing/qa-coverage-final.md` |
| 6. Deployment | Commit, update CI scripts, close workflow | `docs/testing/qa-summary.md` |

---

## 6. Technical Strategy

### Test Framework
- **Vitest** — Already configured with jsdom
- **@testing-library/react** — Already installed
- **@testing-library/user-event** — Already installed

### Mock Strategy
- **API calls**: Mock `axios` at the module level for service tests
- **Services**: Mock service modules for page component tests
- **React Router**: Use `MemoryRouter` for routing-dependent components
- **Auth Context**: Provide mock `AuthProvider` wrapper for protected pages
- **File downloads**: Mock `URL.createObjectURL` and `document.createElement('a')`

### File Organization
```
frontend/src/
├── components/
│   ├── layout/__tests__/       ← NEW: Sidebar, Header, ProtectedRoute
│   ├── pages/__tests__/        ← NEW: All 14 pages
│   ├── forms/__tests__/        ← NEW: All 3 forms
│   └── ui/__tests__/           ← EXISTS: 5 components tested
├── contexts/__tests__/          ← EXISTS: AuthContext; ADD: SnackbarContext
├── services/__tests__/          ← EXISTS: auth, vitals; ADD: 5 more
├── hooks/__tests__/             ← NEW: useAuth, useFetch
└── tests/
    ├── setup.ts                 ← EXISTS
    └── test-utils.tsx           ← NEW: Shared render helpers & mocks
```

---

## 7. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Complex page components hard to test in isolation | Medium | Mock all service dependencies |
| CSS modules may cause import issues in tests | Low | Already handled — `css: true` in vitest config |
| React Router v7 test patterns | Medium | Use `MemoryRouter` with initial entries |
| Large test scope (250+ tests) | Medium | Prioritize P0 items first |

---

**Phase 1 Output:** `docs/testing/qa-vision.md`

**Next:** Phase 2 — Define detailed test cases per component
