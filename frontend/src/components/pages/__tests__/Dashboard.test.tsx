import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockUser } from '../../../tests/test-utils';
import { Dashboard } from '../Dashboard';

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../../contexts/AuthContext';

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser({ first_name: 'Alice' }),
      isAuthenticated: true, loading: false,
      login: vi.fn(), logout: vi.fn(), refreshToken: vi.fn(),
    });
  });

  it('shows loading spinner initially', () => {
    renderWithProviders(<Dashboard />, { routerProps: { initialEntries: ['/dashboard'] } });
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('renders welcome message after loading', async () => {
    renderWithProviders(<Dashboard />, { routerProps: { initialEntries: ['/dashboard'] } });

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Alice/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders portal title after loading', async () => {
    renderWithProviders(<Dashboard />, { routerProps: { initialEntries: ['/dashboard'] } });

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders overview section with charts', async () => {
    renderWithProviders(<Dashboard />, { routerProps: { initialEntries: ['/dashboard'] } });

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Visit Trends')).toBeInTheDocument();
      expect(screen.getByText('Department Comparison')).toBeInTheDocument();
      expect(screen.getByText('Severity Breakdown')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders trends section', async () => {
    renderWithProviders(<Dashboard />, { routerProps: { initialEntries: ['/dashboard'] } });

    await waitFor(() => {
      expect(screen.getByText('Top Diagnoses Trends')).toBeInTheDocument();
      expect(screen.getByText('Common Diagnoses Over Time')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders recent activity section', async () => {
    renderWithProviders(<Dashboard />, { routerProps: { initialEntries: ['/dashboard'] } });

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('View All')).toBeInTheDocument();
      expect(screen.getByText('New OHC Visit')).toBeInTheDocument();
      expect(screen.getByText('Diagnosis Completed')).toBeInTheDocument();
      expect(screen.getByText('Referral Created')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});