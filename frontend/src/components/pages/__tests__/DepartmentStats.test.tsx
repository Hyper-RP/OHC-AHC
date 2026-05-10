import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockDepartmentStats } from '../../../tests/test-utils';
import { DepartmentStats } from '../DepartmentStats';

// Mock services
vi.mock('../../../services/reports', () => ({
  getDepartmentHealthStats: vi.fn(),
  exportDepartmentHealthStats: vi.fn(),
}));

// Mock AuthContext (Header uses useNavigate)
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, first_name: 'Admin', role: 'ADMIN' },
    isAuthenticated: true, loading: false,
    login: vi.fn(), logout: vi.fn(), refreshToken: vi.fn(),
  })),
}));

import { getDepartmentHealthStats, exportDepartmentHealthStats } from '../../../services/reports';

describe('DepartmentStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    vi.mocked(getDepartmentHealthStats).mockReturnValue(new Promise(() => {})); // never resolves
    renderWithProviders(<DepartmentStats />, { routerProps: { initialEntries: ['/reports/department-stats'] } });
    // Loading component renders when loading is true
    expect(getDepartmentHealthStats).toHaveBeenCalled();
  });

  it('fetches stats on mount with default period 90', async () => {
    vi.mocked(getDepartmentHealthStats).mockResolvedValueOnce(mockDepartmentStats());
    renderWithProviders(<DepartmentStats />, { routerProps: { initialEntries: ['/reports/department-stats'] } });

    await waitFor(() => {
      expect(getDepartmentHealthStats).toHaveBeenCalledWith(90);
    });
  });

  it('renders summary cards after loading', async () => {
    vi.mocked(getDepartmentHealthStats).mockResolvedValueOnce(mockDepartmentStats());
    renderWithProviders(<DepartmentStats />, { routerProps: { initialEntries: ['/reports/department-stats'] } });

    await waitFor(() => {
      expect(screen.getByText('Total Departments')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Total Employees')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
    });
  });

  it('renders department cards', async () => {
    vi.mocked(getDepartmentHealthStats).mockResolvedValueOnce(mockDepartmentStats());
    renderWithProviders(<DepartmentStats />, { routerProps: { initialEntries: ['/reports/department-stats'] } });

    await waitFor(() => {
      expect(screen.getByText('Engineering')).toBeInTheDocument();
      expect(screen.getByText('Operations')).toBeInTheDocument();
    });
  });

  it('renders Export CSV button', async () => {
    vi.mocked(getDepartmentHealthStats).mockResolvedValueOnce(mockDepartmentStats());
    renderWithProviders(<DepartmentStats />, { routerProps: { initialEntries: ['/reports/department-stats'] } });

    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });
  });
});
