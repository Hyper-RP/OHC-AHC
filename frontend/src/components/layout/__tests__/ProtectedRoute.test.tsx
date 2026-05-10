import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../../tests/test-utils';
import { ProtectedRoute } from '../ProtectedRoute';

// Mock AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../../contexts/AuthContext';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner when auth is loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null, isAuthenticated: false, loading: true,
      login: vi.fn(), logout: vi.fn(), refreshToken: vi.fn(),
    });

    renderWithRouter(
      <ProtectedRoute><div>Protected Content</div></ProtectedRoute>,
      { initialEntries: ['/dashboard'] }
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, username: 'admin', role: 'ADMIN' } as never,
      isAuthenticated: true, loading: false,
      login: vi.fn(), logout: vi.fn(), refreshToken: vi.fn(),
    });

    renderWithRouter(
      <ProtectedRoute><div>Protected Content</div></ProtectedRoute>,
      { initialEntries: ['/dashboard'] }
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null, isAuthenticated: false, loading: false,
      login: vi.fn(), logout: vi.fn(), refreshToken: vi.fn(),
    });

    // We render inside a route structure to detect the redirect
    renderWithRouter(
      <ProtectedRoute><div>Protected Content</div></ProtectedRoute>,
      { initialEntries: ['/dashboard'] }
    );

    // Content should not be visible since it redirects
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
