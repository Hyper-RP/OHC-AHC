import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../tests/test-utils';
import { EmployeeHealthHistory } from '../EmployeeHealthHistory';

const mockNavigate = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { first_name: 'Admin', role: 'ADMIN' },
    isAuthenticated: true, loading: false,
    login: vi.fn(), logout: vi.fn(), refreshToken: vi.fn(),
  })),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockHistoryData = {
  mode: 'detail' as const,
  employee: {
    id: 1, employee_code: 'EMP-001',
    user: { first_name: 'John', last_name: 'Doe' },
    department: 'Engineering', designation: 'Senior Engineer',
    fitness_status: 'FIT',
  },
  visits: [
    {
      uuid: 'v1', visit_date: '2026-05-01', visit_type: 'WALK_IN',
      chief_complaint: 'Headache', diagnoses: [{ diagnosis_name: 'Migraine' }],
    },
    {
      uuid: 'v2', visit_date: '2026-04-15', visit_type: 'SCHEDULED',
      chief_complaint: 'Back pain', diagnoses: [],
    },
  ],
};

const mockHistoryListData = {
  mode: 'list' as const,
  records: [
    {
      employee_code: 'EMP-001',
      employee_name: 'John Doe',
      visit_uuid: 'v1',
      visit_date: '2026-05-01',
      visit_status: 'CLOSED',
      doctor_name: 'Dr. Smith',
      chief_complaint: 'Headache',
      diagnosis_name: 'Migraine',
      severity: 'MILD',
      fitness_decision: 'FIT',
      medicine_given: 'Paracetamol 650',
      follow_up_date: '',
      referral_status: '',
      report_count: 0,
    },
    {
      employee_code: 'EMP-002',
      employee_name: 'Jane Roe',
      visit_uuid: 'v2',
      visit_date: '2026-05-02',
      visit_status: 'OPEN',
      doctor_name: 'Dr. Adams',
      chief_complaint: 'Fever',
      diagnosis_name: 'Viral Infection',
      severity: 'MODERATE',
      fitness_decision: 'FIT',
      medicine_given: 'ORS Sachet',
      follow_up_date: '',
      referral_status: '',
      report_count: 1,
    },
  ],
};

vi.mock('../../../services/reports', () => ({
  getEmployeeHealthHistory: vi.fn(),
  exportEmployeeHealthHistory: vi.fn(),
}));

import { getEmployeeHealthHistory, exportEmployeeHealthHistory } from '../../../services/reports';

describe('EmployeeHealthHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page header', () => {
    renderWithProviders(<EmployeeHealthHistory />);
    expect(screen.getByText('Employee Health History')).toBeInTheDocument();
  });

  it('renders Employee ID input', () => {
    renderWithProviders(<EmployeeHealthHistory />);
    expect(screen.getByPlaceholderText('Enter employee ID')).toBeInTheDocument();
  });

  it('renders Load button', () => {
    renderWithProviders(<EmployeeHealthHistory />);
    expect(screen.getByText('Load')).toBeInTheDocument();
  });

  it('navigates to detail page when employee id is provided', async () => {
    vi.mocked(getEmployeeHealthHistory).mockResolvedValue(mockHistoryData);

    renderWithProviders(<EmployeeHealthHistory />);
    const input = screen.getByPlaceholderText('Enter employee ID');
    fireEvent.change(input, { target: { value: 'EMP-001' } });
    fireEvent.click(screen.getByText('Load'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/reports/employee-history/EMP-001');
    });
  });

  it('loads employee data even when employee ID is blank', async () => {
    vi.mocked(getEmployeeHealthHistory).mockResolvedValue(mockHistoryListData);

    renderWithProviders(<EmployeeHealthHistory />);
    fireEvent.click(screen.getByText('Load'));

    await waitFor(() => {
      expect(getEmployeeHealthHistory).toHaveBeenCalledWith(undefined);
      expect(screen.getByText('Patient Records (2)')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Roe')).toBeInTheDocument();
    });
  });

  it('handles load failure', async () => {
    vi.mocked(getEmployeeHealthHistory).mockRejectedValue(new Error('Not found'));
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderWithProviders(<EmployeeHealthHistory />);
    const input = screen.getByPlaceholderText('Enter employee ID');
    fireEvent.change(input, { target: { value: 'EMP-999' } });
    fireEvent.click(screen.getByText('Load'));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to load employee history');
    });
  });
});
