import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUser } from '../../../tests/test-utils';
import { Role } from '../../types';

const mockNavigate = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: mockUser({ role: Role.MANAGEMENT }),
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
  getMedicineSummary: vi.fn(),
}));

describe('ManagementDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(mockNavigate, 'mockReturnValue');
  });

  describe('Rendering', () => {
    it('renders page header', async () => {
      renderWithProviders(<ManagementDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Management Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Analytics and reports')).toBeInTheDocument();
      });
    });

    it('displays view toggle between analytics and medicine', async () => {
      renderWithProviders(<ManagementDashboard />);
      await waitFor(() => {
        const toggle = screen.getByRole('button', { name: /Analytics/i });
        expect(toggle).toBeInTheDocument();
        const medicineButton = screen.getByRole('button', { name: /Medicine Reports/i });
        expect(medicineButton).toBeInTheDocument();
      });
    });

    it('renders loading state', async () => {
      const { getDashboard } = await import('../../services/analytics');

      vi.mocked(getDashboard, 'mockImplementation').mockResolvedValue(undefined);

      renderWithProviders(<ManagementDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Loading data...')).toBeInTheDocument();
      });
    });

    it('displays error alert', async () => {
      const { show } = vi.spyOn(vi.importActual('../../../contexts/SnackbarContext'), 'useSnackbar').mockReturnValue({
        show: vi.fn(),
      });

      renderWithProviders(<ManagementDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Failed to fetch data')).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    it('fetches dashboard analytics on mount', async () => {
      const { getDashboard, getMedicineSummary } = await import('../../services/analytics');

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
          { department: 'HR', visit_count: 200, percentage: 16 },
        ],
        severity_wise: {
          LOW: 450,
          MEDIUM: 200,
          HIGH: 300,
          CRITICAL: 50,
        },
        common_diagnoses: [
          { diagnosis_name: 'Upper Respiratory Infection', count: 120 },
          { diagnosis_name: 'Back Pain', count: 85 },
        ],
      };

      vi.mocked(getDashboard, 'mockResolvedValue').mockResolvedValue(mockAnalytics);

      renderWithProviders(<ManagementDashboard />);

      await waitFor(() => {
        expect(getDashboard).toHaveBeenCalled();
      });
    });

    it('fetches medicine summary on view toggle', async () => {
      const { getDashboard, getMedicineSummary } = await import('../../services/analytics');

      const mockAnalytics = {
        summary: {
          total_ohc_visits: 1250,
          total_medicine_used: 5000,
        stock_summary: {
            total_stock: 1000,
            low_stock_items: 15,
            total_stock_value: '₹50,000',
          },
        },
      };

      vi.mocked(getDashboard, 'mockResolvedValue').mockResolvedValue(mockAnalytics);
      vi.mocked(getMedicineSummary, 'mockResolvedValue').mockResolvedValue(mockAnalytics);

      const { setAnalytics, setMedicineSummary } = await import('../../services/analytics');
      vi.spyOn(setAnalytics, 'mockReturnValue');
      vi.spyOn(setMedicineSummary, 'mockReturnValue');

      renderWithProviders(<ManagementDashboard />);

      const viewToggle = screen.getByRole('button', { name: /Medicine Reports/i });
      fireEvent.click(viewToggle);

      await waitFor(() => {
        expect(getMedicineSummary).toHaveBeenCalledWith();
        expect(screen.getByText('Total OHC Visits')).toBeInTheDocument();
        expect(screen.getByText('Total Medicine Used')).toBeInTheDocument();
      });
    });
  });

  describe('Read-Only Access Control', () => {
    it('prevents access by non-management users', async () => {
      const { useAuth } = await import('../../../contexts/AuthContext');
      const useSpy = vi.spyOn(useAuth, 'useAuth');

      useSpy.mockReturnValue({ user: mockUser({ role: 'EHS' }), isAuthenticated: true, loading: false });

      renderWithProviders(<ManagementDashboard />);

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage.textContent).toContain('Access restricted');
      });
    });

    it('does not show edit capabilities for read-only users', async () => {
      renderWithProviders(<ManagementDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
        expect(screen.queryByText('Delete')).not.toBeInTheDocument();
        expect(screen.queryByText('Modify')).not.toBeInTheDocument();
      });
    });

  describe('Navigation', () => {
    it('does not provide navigation back to dashboard', async () => {
      renderWithProviders(<ManagementDashboard />);

      // Management dashboard has no navigation, it's a read-only view
      expect(screen.queryByRole('link', { name: /dashboard/i }).not.toBeInTheDocument();
    });
  });
});
