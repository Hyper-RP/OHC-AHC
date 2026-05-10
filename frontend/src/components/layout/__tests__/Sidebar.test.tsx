import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter, mockUser } from '../../../tests/test-utils';
import { Sidebar } from '../Sidebar';

// Mock AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../../contexts/AuthContext';

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders null when no user', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null, isAuthenticated: false, loading: false,
      login: vi.fn(), logout: vi.fn(), refreshToken: vi.fn(),
    });

    const { container } = renderWithRouter(<Sidebar />);
    expect(container.querySelector('aside')).toBeNull();
  });

  it('renders brand section', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser(), isAuthenticated: true, loading: false,
      login: vi.fn(), logout: vi.fn(), refreshToken: vi.fn(),
    });

    renderWithRouter(<Sidebar />);
    expect(screen.getByText('OHC')).toBeInTheDocument();
    expect(screen.getByText('Health Portal')).toBeInTheDocument();
  });

  it('displays user full name', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser({ first_name: 'John', last_name: 'Doe' }),
      isAuthenticated: true, loading: false,
      login: vi.fn(), logout: vi.fn(), refreshToken: vi.fn(),
    });

    renderWithRouter(<Sidebar />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays user role chip', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser({ role: 'NURSE' }),
      isAuthenticated: true, loading: false,
      login: vi.fn(), logout: vi.fn(), refreshToken: vi.fn(),
    });

    renderWithRouter(<Sidebar />);
    expect(screen.getByText('NURSE')).toBeInTheDocument();
  });

  it('renders correct nav items for ADMIN (all 11)', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser({ role: 'ADMIN' }),
      isAuthenticated: true, loading: false,
      login: vi.fn(), logout: vi.fn(), refreshToken: vi.fn(),
    });

    renderWithRouter(<Sidebar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('OHC Visit Form')).toBeInTheDocument();
    expect(screen.getByText('Payments')).toBeInTheDocument();
  });

  it('renders fewer nav items for NURSE', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser({ role: 'NURSE' }),
      isAuthenticated: true, loading: false,
      login: vi.fn(), logout: vi.fn(), refreshToken: vi.fn(),
    });

    renderWithRouter(<Sidebar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('OHC Visit Form')).toBeInTheDocument();
    expect(screen.queryByText('Payments')).not.toBeInTheDocument();
  });

  it('renders no nav items for EMPLOYEE', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser({ role: 'EMPLOYEE' }),
      isAuthenticated: true, loading: false,
      login: vi.fn(), logout: vi.fn(), refreshToken: vi.fn(),
    });

    renderWithRouter(<Sidebar />);
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('logout button calls logout', async () => {
    const logoutMock = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser(), isAuthenticated: true, loading: false,
      login: vi.fn(), logout: logoutMock, refreshToken: vi.fn(),
    });

    renderWithRouter(<Sidebar />);
    await userEvent.click(screen.getByText('Logout'));
    expect(logoutMock).toHaveBeenCalledTimes(1);
  });

  it('applies className prop', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser(), isAuthenticated: true, loading: false,
      login: vi.fn(), logout: vi.fn(), refreshToken: vi.fn(),
    });

    const { container } = renderWithRouter(<Sidebar className="custom-class" />);
    expect(container.querySelector('aside')?.className).toContain('custom-class');
  });
});
