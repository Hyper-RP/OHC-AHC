import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../tests/test-utils';
import { EmployeeHealthHistory } from '../EmployeeHealthHistory';

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { first_name: 'Admin', role: 'ADMIN' },
    isAuthenticated: true, loading: false,
    login: vi.fn(), logout: vi.fn(), refreshToken: vi.fn(),
  })),
}));

const mockHistoryData = {
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

  it('loads and displays employee data', async () => {
    vi.mocked(getEmployeeHealthHistory).mockResolvedValue(mockHistoryData);

    renderWithProviders(<EmployeeHealthHistory />);
    const input = screen.getByPlaceholderText('Enter employee ID');
    fireEvent.change(input, { target: { value: 'EMP-001' } });
    fireEvent.click(screen.getByText('Load'));

    await waitFor(() => {
      expect(screen.getByText('Employee Summary')).toBeInTheDocument();
      expect(screen.getByText(/John/)).toBeInTheDocument();
      expect(screen.getByText(/Engineering/)).toBeInTheDocument();
    });
  });

  it('displays visit list after loading', async () => {
    vi.mocked(getEmployeeHealthHistory).mockResolvedValue(mockHistoryData);

    renderWithProviders(<EmployeeHealthHistory />);
    const input = screen.getByPlaceholderText('Enter employee ID');
    fireEvent.change(input, { target: { value: 'EMP-001' } });
    fireEvent.click(screen.getByText('Load'));

    await waitFor(() => {
      expect(screen.getByText('Visits (2)')).toBeInTheDocument();
      expect(screen.getByText(/Headache/)).toBeInTheDocument();
    });
  });

  it('shows diagnosis name when available', async () => {
    vi.mocked(getEmployeeHealthHistory).mockResolvedValue(mockHistoryData);

    renderWithProviders(<EmployeeHealthHistory />);
    const input = screen.getByPlaceholderText('Enter employee ID');
    fireEvent.change(input, { target: { value: 'EMP-001' } });
    fireEvent.click(screen.getByText('Load'));

    await waitFor(() => {
      expect(screen.getByText(/Migraine/)).toBeInTheDocument();
    });
  });

  it('shows Export CSV button after loading data', async () => {
    vi.mocked(getEmployeeHealthHistory).mockResolvedValue(mockHistoryData);

    renderWithProviders(<EmployeeHealthHistory />);
    const input = screen.getByPlaceholderText('Enter employee ID');
    fireEvent.change(input, { target: { value: 'EMP-001' } });
    fireEvent.click(screen.getByText('Load'));

    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
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
