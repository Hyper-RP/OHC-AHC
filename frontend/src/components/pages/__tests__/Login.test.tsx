import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../tests/test-utils';
import { Login } from '../Login';

// Mock dependencies
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));
vi.mock('../../../contexts/SnackbarContext', () => ({
  useSnackbar: vi.fn(() => ({ show: vi.fn(), close: vi.fn(), isOpen: false, currentMessage: null })),
  SnackbarProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import { useAuth } from '../../../contexts/AuthContext';
import { useSnackbar } from '../../../contexts/SnackbarContext';

describe('Login', () => {
  const mockLogin = vi.fn();
  const mockShow = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: null, isAuthenticated: false, loading: false,
      login: mockLogin, logout: vi.fn(), refreshToken: vi.fn(),
    });
    vi.mocked(useSnackbar).mockReturnValue({
      show: mockShow, close: vi.fn(), isOpen: false, currentMessage: null,
    });
  });

  it('renders login form with username and password fields', () => {
    renderWithProviders(<Login />, { routerProps: { initialEntries: ['/login'] } });
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
  });

  it('renders Sign In button', () => {
    renderWithProviders(<Login />, { routerProps: { initialEntries: ['/login'] } });
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders OHC-AHC branding', () => {
    renderWithProviders(<Login />, { routerProps: { initialEntries: ['/login'] } });
    expect(screen.getByText('OHC-AHC')).toBeInTheDocument();
  });

  it('shows error when submitting empty fields', async () => {
    renderWithProviders(<Login />, { routerProps: { initialEntries: ['/login'] } });
    const form = screen.getByRole('button', { name: /sign in/i }).closest('form')!;
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText('Please enter both username and password')).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login with credentials on submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    renderWithProviders(<Login />, { routerProps: { initialEntries: ['/login'] } });

    await userEvent.type(screen.getByPlaceholderText('Enter your username'), 'admin_test');
    await userEvent.type(screen.getByPlaceholderText('Enter your password'), 'Test@12345');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ username: 'admin_test', password: 'Test@12345' });
    });
  });

  it('displays error on login failure', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
    renderWithProviders(<Login />, { routerProps: { initialEntries: ['/login'] } });

    await userEvent.type(screen.getByPlaceholderText('Enter your username'), 'bad');
    await userEvent.type(screen.getByPlaceholderText('Enter your password'), 'bad');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows snackbar on failure', async () => {
    mockLogin.mockRejectedValueOnce(new Error('fail'));
    renderWithProviders(<Login />, { routerProps: { initialEntries: ['/login'] } });

    await userEvent.type(screen.getByPlaceholderText('Enter your username'), 'x');
    await userEvent.type(screen.getByPlaceholderText('Enter your password'), 'x');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockShow).toHaveBeenCalledWith('Login failed', 'error');
    });
  });
});
