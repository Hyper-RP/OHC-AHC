import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../tests/test-utils';
import { CompleteIntake } from '../CompleteIntake';

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { first_name: 'Admin', role: 'ADMIN' },
    isAuthenticated: true, loading: false,
    login: vi.fn(), logout: vi.fn(), refreshToken: vi.fn(),
  })),
}));

describe('CompleteIntake', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('renders page title', () => {
    renderWithProviders(<CompleteIntake />);
    expect(screen.getByText('Complete Visit Intake')).toBeInTheDocument();
  });

  it('renders description text', () => {
    renderWithProviders(<CompleteIntake />);
    expect(screen.getByText(/mark the visit as complete/)).toBeInTheDocument();
  });

  it('renders Visit UUID input', () => {
    renderWithProviders(<CompleteIntake />);
    expect(screen.getByPlaceholderText('Enter the visit UUID to complete')).toBeInTheDocument();
  });

  it('renders Complete Intake button', () => {
    renderWithProviders(<CompleteIntake />);
    expect(screen.getByRole('button', { name: /Complete Intake/ })).toBeInTheDocument();
  });

  it('shows alert when submitting without visit ID', () => {
    renderWithProviders(<CompleteIntake />);
    fireEvent.click(screen.getByRole('button', { name: /Complete Intake/ }));
    expect(window.alert).toHaveBeenCalledWith('Please enter a visit ID');
  });

  it('shows confirmation alert when submitting with visit ID', () => {
    renderWithProviders(<CompleteIntake />);
    const input = screen.getByPlaceholderText('Enter the visit UUID to complete');
    fireEvent.change(input, { target: { value: 'visit-123' } });
    fireEvent.click(screen.getByRole('button', { name: /Complete Intake/ }));
    expect(window.alert).toHaveBeenCalledWith('Completing intake for visit: visit-123');
  });
});
