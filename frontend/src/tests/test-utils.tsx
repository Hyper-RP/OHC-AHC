/**
 * Shared test utilities for OHC-AHC React frontend
 * Provides render helpers, mock providers, and test data factories
 */
import React from 'react';
import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { MemoryRouterProps } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { SnackbarProvider } from '../contexts/SnackbarContext';

// ─── Mock Auth Context Value ─────────────────────────────────────────────────

export interface MockAuthValue {
  user: import('../types').User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
  refreshToken: ReturnType<typeof vi.fn>;
}

export const createMockAuth = (overrides?: Partial<MockAuthValue>): MockAuthValue => ({
  user: mockUser(),
  isAuthenticated: true,
  loading: false,
  login: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn(),
  refreshToken: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

// ─── Mock Auth Provider ──────────────────────────────────────────────────────

const MockAuthContext = React.createContext<MockAuthValue | undefined>(undefined);

/**
 * Mock AuthProvider that allows injecting auth state directly
 * without hitting the real auth service
 */
export const MockAuthProvider: React.FC<{
  value?: Partial<MockAuthValue>;
  children: ReactNode;
}> = ({ value, children }) => {
  const authValue = createMockAuth(value);
  return <MockAuthContext.Provider value={authValue}>{children}</MockAuthContext.Provider>;
};

// ─── All-Providers Wrapper ───────────────────────────────────────────────────

interface AllProvidersProps {
  children: ReactNode;
  authValue?: Partial<MockAuthValue>;
  routerProps?: MemoryRouterProps;
}

/**
 * Wraps children in all required providers for testing:
 * - MemoryRouter (with configurable initial entries)
 * - SnackbarProvider
 *
 * Note: Auth is mocked at module level in individual tests
 */
const AllProviders: React.FC<AllProvidersProps> = ({
  children,
  routerProps = { initialEntries: ['/'] },
}) => {
  return (
    <MemoryRouter {...routerProps}>
      <SnackbarProvider>
        {children}
      </SnackbarProvider>
    </MemoryRouter>
  );
};

// ─── Custom Render ───────────────────────────────────────────────────────────

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authValue?: Partial<MockAuthValue>;
  routerProps?: MemoryRouterProps;
}

/**
 * Custom render that wraps components in all required providers.
 * Use this instead of @testing-library/react's render.
 *
 * @example
 * renderWithProviders(<Dashboard />, {
 *   routerProps: { initialEntries: ['/dashboard'] },
 * });
 */
export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { authValue, routerProps, ...renderOptions } = options;

  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <AllProviders authValue={authValue} routerProps={routerProps}>
      {children}
    </AllProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Render with only MemoryRouter (no Snackbar/Auth providers).
 * Use for simple components that only need routing context.
 */
export const renderWithRouter = (
  ui: ReactElement,
  routerProps: MemoryRouterProps = { initialEntries: ['/'] },
  renderOptions?: Omit<RenderOptions, 'wrapper'>
) => {
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <MemoryRouter {...routerProps}>{children}</MemoryRouter>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// ─── Data Factories ──────────────────────────────────────────────────────────

/**
 * Creates a mock User object.
 * Override any field by passing partial data.
 */
export const mockUser = (overrides?: Partial<import('../types').User>): import('../types').User => ({
  id: 1,
  email: 'admin@ohc-ahc.com',
  username: 'admin_test',
  first_name: 'Admin',
  last_name: 'User',
  role: 'ADMIN',
  phone_number: '9876543210',
  is_verified: true,
  must_change_password: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  is_admin_user: true,
  is_hr_user: false,
  is_nurse_user: false,
  is_doctor_user: false,
  is_ehs_user: false,
  is_kam_user: false,
  is_employee_user: false,
  ...overrides,
});

/**
 * Creates a mock OHCVisit object
 */
export const mockVisit = (overrides?: Partial<import('../types').OHCVisit>): import('../types').OHCVisit => ({
  uuid: 'visit-uuid-001',
  employee: {
    id: 1,
    employee_code: 'EMP-001',
    user: { first_name: 'John', last_name: 'Doe' },
  },
  consulted_doctor: {
    id: 1,
    user: { first_name: 'Dr. Sarah', last_name: 'Smith' },
    registration_number: 'DOC-001',
    specialization: 'General Medicine',
  },
  visit_type: 'WALK_IN',
  visit_status: 'OPEN',
  triage_level: 'LOW',
  visit_date: '2026-05-01',
  chief_complaint: 'Headache',
  symptoms: 'Mild headache, fatigue',
  vitals: {
    temperature: '98.6',
    blood_pressure: '120/80',
    pulse: '72',
    spo2: '98',
    weight: '70',
    height: '175',
  },
  preliminary_notes: 'Patient appears stable',
  requires_referral: false,
  created_at: '2026-05-01T10:00:00Z',
  ...overrides,
});

/**
 * Creates a mock Hospital object
 */
export const mockHospital = (overrides?: Partial<import('../types').Hospital>): import('../types').Hospital => ({
  uuid: 'hosp-uuid-001',
  name: 'City General Hospital',
  code: 'CGH-001',
  hospital_status: 'ACTIVE',
  hospital_type: 'Multi-Specialty',
  contact_person: 'Dr. Rajesh Kumar',
  phone_number: '9876543210',
  email: 'info@citygeneral.com',
  address_line_1: '123 Medical Lane',
  city: 'Mumbai',
  state: 'Maharashtra',
  specialties: ['Cardiology', 'Orthopedics', 'General Medicine'],
  supports_cashless: true,
  is_available_for_video: false,
  ...overrides,
});

/**
 * Creates a mock Referral object
 */
export const mockReferral = (overrides?: Partial<import('../types').Referral>): import('../types').Referral => ({
  uuid: 'ref-uuid-001',
  visit: 'visit-uuid-001',
  employee: {
    id: 1,
    employee_code: 'EMP-001',
    user: { first_name: 'John', last_name: 'Doe' },
  },
  referred_by: {
    id: 1,
    user: { first_name: 'Dr. Sarah', last_name: 'Smith' },
  },
  hospital: { id: 1, name: 'City General Hospital', code: 'CGH-001' },
  referral_reason: 'Requires specialist consultation',
  specialist_department: 'Cardiology',
  priority: 'NORMAL',
  referral_status: 'PENDING_HOSPITAL_SELECTION',
  created_at: '2026-05-01T10:00:00Z',
  ...overrides,
});

/**
 * Creates a mock Invoice object
 */
export const mockInvoice = (overrides?: Partial<import('../types').Invoice>): import('../types').Invoice => ({
  uuid: 'inv-uuid-001',
  invoice_number: 'INV-2026-001',
  employee: {
    id: 1,
    employee_code: 'EMP-001',
    user: { first_name: 'John', last_name: 'Doe' },
  },
  status: 'ISSUED',
  subtotal_amount: 5000,
  tax_amount: 900,
  total_amount: 5900,
  due_date: '2026-06-01',
  issued_at: '2026-05-01T10:00:00Z',
  notes: 'OHC consultation charges',
  created_at: '2026-05-01T10:00:00Z',
  ...overrides,
});

/**
 * Creates mock DepartmentStats data
 */
export const mockDepartmentStats = (overrides?: Partial<import('../types').DepartmentStats>): import('../types').DepartmentStats => ({
  period_start: '2026-02-01',
  period_end: '2026-05-01',
  summary: {
    total_departments: 5,
    total_employees: 500,
    total_visits: 1234,
    total_referrals: 89,
    avg_health_index: 85,
  },
  departments: [
    {
      department: 'Engineering',
      total_employees: 120,
      total_visits: 340,
      referred_cases: 25,
      unfit_employees: 3,
      health_index: 88,
      top_diagnosis: { diagnosis_name: 'Upper Respiratory Infection', count: 45 },
    },
    {
      department: 'Operations',
      total_employees: 80,
      total_visits: 220,
      referred_cases: 18,
      unfit_employees: 2,
      health_index: 82,
      top_diagnosis: { diagnosis_name: 'Back Pain', count: 30 },
    },
  ],
  ...overrides,
});

/**
 * Creates mock DiseaseTrends data
 */
export const mockDiseaseTrends = (overrides?: Partial<import('../types').DiseaseTrends>): import('../types').DiseaseTrends => ({
  period_start: '2026-02-01',
  period_end: '2026-05-01',
  total_diagnoses: 450,
  trends: [
    {
      diagnosis_name: 'Upper Respiratory Infection',
      count: 120,
      severity: 'MILD',
      percentage: 26.7,
      change_from_previous: 5,
    },
    {
      diagnosis_name: 'Back Pain',
      count: 85,
      severity: 'MODERATE',
      percentage: 18.9,
      change_from_previous: -3,
    },
  ],
  severity_breakdown: { MILD: 200, MODERATE: 150, SERIOUS: 80, CRITICAL: 20 },
  ...overrides,
});

/**
 * Creates a mock PaginatedResponse
 */
export const mockPaginatedResponse = <T,>(results: T[], count?: number): import('../types').PaginatedResponse<T> => ({
  count: count ?? results.length,
  next: null,
  previous: null,
  results,
});

// ─── Helper Utilities ────────────────────────────────────────────────────────

/**
 * Wait for all pending promises to resolve.
 * Useful after state updates that trigger async effects.
 */
export const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Creates a mock blob for testing file downloads
 */
export const mockBlob = (content: string = 'test,csv,data', type: string = 'text/csv'): Blob => {
  return new Blob([content], { type });
};
