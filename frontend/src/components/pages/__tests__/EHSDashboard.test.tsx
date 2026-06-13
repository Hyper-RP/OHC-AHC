import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUser, mockVisit } from '../../../tests/test-utils';
import { getDashboard, exportAnalytics, handleApiError } from '../../services/analytics';
import { Role } from '../../types';

const mockNavigate = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: mockUser({ role: 'EHS' }),
    isAuthenticated: true,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
  })),
}));

vi.mock('../../../contexts/SnackbarContext', () => ({
  useSnackbar: vi.fn(() => ({
    show: vi.fn(),
    messages: [],
    removeMessage: vi.fn(),
  })),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../services/analytics', () => ({
  getDashboard: vi.fn(),
  exportAnalytics: vi.fn().mockResolvedValue({ blob: new Blob(['test,csv'], { type: 'text/csv' }) }),
}));

describe('EHSDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(mockNavigate, 'mockReturnValue');
    vi.spyOn(vi.importActual('../../../contexts/SnackbarContext'), 'useSnackbar').mockReturnValue({
      show: vi.fn(),
    });
  });

  describe('Rendering', () => {
    it('renders page header', async () => {
      renderWithProviders(<EHSDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Management Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Analytics and reports')).toBeInTheDocument();
      });
    });

    it('renders filter card', async () => {
      renderWithProviders(<EHSDashboard />);
      await waitFor(() => {
        expect(screen.getByText('From Date')).toBeInTheDocument();
        expect(screen.getByLabelText('date-from')).toBeInTheDocument();
        expect(screen.getByLabelText('date-to')).toBeInTheDocument();
        expect(screen.getByLabelText('department')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
      });
    });

    it('renders summary cards', async () => {
      const mockAnalytics = {
        summary: {
          total_visits: 1250,
          open_cases: 25,
          completed_cases: 1190,
          follow_up_pending: 5,
        },
        department_wise: [
          { department: 'Engineering', visit_count: 350, percentage: 28 },
          { department: 'Operations', visit_count: 420, percentage: 33.6 },
        ],
        severity_wise: {
          LOW: 450,
          MEDIUM: 200,
          HIGH: 300,
          CRITICAL: 50,
        },
      };

      vi.mocked(getDashboard, 'mockResolvedValue').mockResolvedValue(mockAnalytics);

      renderWithProviders(<EHSDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Total Visits')).toBeInTheDocument();
        expect(screen.getByText('1250')).toBeInTheDocument();
        expect(screen.getByText('Open Cases')).toBeInTheDocument();
        expect(screen.getByText('Completed Cases')).toBeInTheDocument();
        expect(screen.getByText('Pending Follow-ups')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });

    it('renders chart card', async () => {
      renderWithProviders(<EHSDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Department-wise Visits')).toBeInTheDocument();
      });
    });
  });

  describe('Filters', () => {
    it('handles date filter change', async () => {
      renderWithProviders(<EHSDashboard />);
      const dateFromInput = screen.getByLabelText('date-from') as HTMLInputElement;
      fireEvent.change(dateFromInput, '2026-01-01');

      await waitFor(() => {
        expect(screen.getByText('Department-wise Visits')).toBeInTheDocument();
        expect(dateFromInput).toHaveValue('2026-01-01');
      });
    });

    it('handles department filter change', async () => {
      renderWithProviders(<EHSDashboard />);
      const departmentInput = screen.getByLabelText('department') as HTMLInputElement;
      fireEvent.change(departmentInput, 'Engineering');

      await waitFor(() => {
        expect(screen.getByText('Department-wise Visits')).toBeInTheDocument();
        expect(departmentInput).toHaveValue('Engineering');
      });
    });

    it('handles severity filter change', async () => {
      renderWithProviders(<EHSDashboard />);
      const severitySelect = screen.getByRole('combobox', { name: 'Severity' });

      fireEvent.change(severitySelect, 'MEDIUM');

      await waitFor(() => {
        expect(screen.getByText('Department-wise Visits')).toBeInTheDocument();
        expect(severitySelect).toHaveValue('MEDIUM');
      });
    });
  });

  describe('Navigation', () => {
    it('refreshes analytics on button click', async () => {
      renderWithProviders(<EHSDashboard />);
      const refreshButton = screen.getByRole('button', { name: 'Refresh' });

      vi.mocked(getDashboard, 'mockImplementation').mockResolvedValue(undefined);

      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(getDashboard).toHaveBeenCalled();
        expect(getDashboard).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Export', () => {
    it('exports analytics as CSV', async () => {
      const mockBlob = new Blob(['test,data,\\n'], { type: 'text/csv' });
      const mockUrl = {
        createObjectURL: vi.fn().mockReturnValue('test-url'),
        revokeObjectURL: vi.fn(),
      };
      global.URL.createObjectURL = mockUrl;

      renderWithProviders(<EHSDashboard />);
      const exportButton = screen.getByRole('button', { name: 'Export' });

      vi.mocked(exportAnalytics, 'mockImplementation').mockResolvedValue(mockBlob);

      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockUrl.createObjectURL).toHaveBeenCalledWith(mockBlob, 'test-url');
        expect(mockUrl.createObjectURL).toHaveBeenCalled();
        expect(exportAnalytics).toHaveBeenCalledWith(expect.any(Object), 'csv');
        expect(mockUrl.createObjectURL).toHaveBeenCalled();
        expect(mockUrl.revokeObjectURL).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error alert', async () => {
      const mockError = new Error('Failed to fetch analytics');
      vi.mocked(getDashboard, 'mockRejectedValue').mockRejectedValue(mockError);

      renderWithProviders(<EHSDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Failed to fetch analytics')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });
});
