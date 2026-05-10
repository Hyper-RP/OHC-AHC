import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
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

  it('renders quick action cards after loading', async () => {
    renderWithProviders(<Dashboard />, { routerProps: { initialEntries: ['/dashboard'] } });

    // Wait for the 1000ms simulated loading + render
    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Diagnosis Entry')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders key insights after loading', async () => {
    renderWithProviders(<Dashboard />, { routerProps: { initialEntries: ['/dashboard'] } });

    await waitFor(() => {
      expect(screen.getByText('Most Common Diagnosis')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders recent activity section after loading', async () => {
    renderWithProviders(<Dashboard />, { routerProps: { initialEntries: ['/dashboard'] } });

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders portal title after loading', async () => {
    renderWithProviders(<Dashboard />, { routerProps: { initialEntries: ['/dashboard'] } });

    await waitFor(() => {
      expect(screen.getByText('Welcome to OHC-AHC Health Portal')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
