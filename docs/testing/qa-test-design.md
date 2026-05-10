# Phase 3: Design — QA Test Architecture

**Project:** OHC-AHC React Frontend — Comprehensive QA
**Date:** 2026-05-09
**Status:** Phase 3 Complete

---

## Progress Bar
```
[████████████████████████████████████████████████████] Phase 1: Planning (Complete)
[████████████████████████████████████████████████████] Phase 2: Requirements (Complete)
[████████████████████████████████████████████████████] Phase 3: Design (Current)
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 4: Development
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 5: Testing
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 6: Deployment
```

---

## Test Architecture

### Infrastructure Files Created

| File | Purpose |
|------|---------|
| `src/tests/test-utils.tsx` | Shared render helpers and data factories |
| `src/tests/mocks/api.mock.ts` | Mock for `services/api.ts` (axios instance) |
| `src/tests/mocks/auth-context.mock.tsx` | Mock for `AuthContext` with `__setAuthMock()` helper |
| `src/tests/mocks/snackbar-context.mock.tsx` | Mock for `SnackbarContext` |

### Verification

- ✅ TypeScript compiles clean (`tsc --noEmit` → exit 0)
- ✅ All 108 existing tests still pass (zero regressions)

---

## Mock Strategy

### Layer 1: Service Tests
Mock the `api` axios instance directly. Each service function calls `api.get/post/patch`, so we mock those.

```typescript
vi.mock('../../services/api', () => import('../../tests/mocks/api.mock'));

// In test:
api.get.mockResolvedValueOnce({ data: mockData });
const result = await serviceFunction();
expect(api.get).toHaveBeenCalledWith('/expected/endpoint/', { params });
```

### Layer 2: Page Component Tests
Mock the service modules (not axios). Pages call service functions, so we mock at that boundary.

```typescript
vi.mock('../../services/reports');

// In test:
vi.mocked(getDepartmentHealthStats).mockResolvedValue(mockDepartmentStats());
render(<DepartmentStats />);
```

### Layer 3: Layout Component Tests
Mock AuthContext (for Sidebar, ProtectedRoute) using the shared auth mock.

```typescript
vi.mock('../../contexts/AuthContext', () =>
  import('../../tests/mocks/auth-context.mock')
);

// Customize per test:
import { __setAuthMock } from '../../tests/mocks/auth-context.mock';
__setAuthMock({ user: mockUser({ role: 'NURSE' }) });
```

---

## Render Helpers

| Helper | When to Use |
|--------|------------|
| `renderWithProviders(ui, opts)` | Pages that need Router + Snackbar |
| `renderWithRouter(ui, routerProps)` | Components that only need Router |
| `render(ui)` | Pure components with no provider deps |

---

## Data Factories

| Factory | Returns |
|---------|---------|
| `mockUser(overrides?)` | `User` with ADMIN role by default |
| `mockVisit(overrides?)` | `OHCVisit` with complete data |
| `mockHospital(overrides?)` | `Hospital` with ACTIVE status |
| `mockReferral(overrides?)` | `Referral` with PENDING status |
| `mockInvoice(overrides?)` | `Invoice` with ISSUED status |
| `mockDepartmentStats(overrides?)` | `DepartmentStats` with 2 departments |
| `mockDiseaseTrends(overrides?)` | `DiseaseTrends` with 2 trends |
| `mockPaginatedResponse(results)` | `PaginatedResponse<T>` wrapper |
| `mockBlob(content?, type?)` | `Blob` for download tests |

---

## Test File Structure (Phase 4 Plan)

```
frontend/src/
├── tests/
│   ├── setup.ts                          ← EXISTS
│   ├── test-utils.tsx                    ← NEW (Phase 3)
│   └── mocks/
│       ├── api.mock.ts                   ← NEW (Phase 3)
│       ├── auth-context.mock.tsx         ← NEW (Phase 3)
│       └── snackbar-context.mock.tsx     ← NEW (Phase 3)
├── services/__tests__/
│   ├── auth.test.ts                      ← EXISTS (11 tests)
│   ├── vitals.test.ts                    ← EXISTS (24 tests)
│   ├── api.test.ts                       ← Phase 4
│   ├── ohc.test.ts                       ← Phase 4
│   ├── ahc.test.ts                       ← Phase 4
│   ├── payments.test.ts                  ← Phase 4
│   └── reports.test.ts                   ← Phase 4
├── contexts/__tests__/
│   ├── AuthContext.test.tsx              ← EXISTS (10 tests)
│   └── SnackbarContext.test.tsx          ← Phase 4
├── utils/__tests__/
│   ├── helpers.test.ts                   ← Phase 4
│   └── navigation.test.ts               ← Phase 4
├── components/
│   ├── layout/__tests__/
│   │   ├── ProtectedRoute.test.tsx       ← Phase 4
│   │   ├── Sidebar.test.tsx              ← Phase 4
│   │   └── Header.test.tsx               ← Phase 4
│   ├── pages/__tests__/
│   │   ├── Login.test.tsx                ← Phase 4
│   │   ├── Dashboard.test.tsx            ← Phase 4
│   │   ├── PublicHome.test.tsx           ← Phase 4
│   │   ├── DepartmentStats.test.tsx      ← Phase 4
│   │   ├── DiseaseTrends.test.tsx        ← Phase 4
│   │   └── ReportsPage.test.tsx          ← Phase 4
│   └── ui/__tests__/
│       ├── Button.test.tsx               ← EXISTS (14 tests)
│       ├── Card.test.tsx                 ← EXISTS (9 tests)
│       ├── FormInput.test.tsx            ← EXISTS (20 tests)
│       ├── StatCard.test.tsx             ← EXISTS (10 tests)
│       └── Alert.test.tsx                ← EXISTS (10 tests)
```

---

**Phase 3 Output:** `docs/testing/qa-test-design.md` + 4 infrastructure files

**Next:** Phase 4 — Write all 173 test cases
