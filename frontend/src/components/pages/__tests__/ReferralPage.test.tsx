import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../tests/test-utils';
import { ReferralPage } from '../ReferralPage';

const mockNavigate = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { first_name: 'Admin', role: 'ADMIN' },
    isAuthenticated: true, loading: false,
    login: vi.fn(), logout: vi.fn(), refreshToken: vi.fn(),
  })),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../../services/ahc', () => ({
  createReferral: vi.fn(),
}));

describe('ReferralPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page header', () => {
    renderWithProviders(<ReferralPage />);
    expect(screen.getByText('Referral Details')).toBeInTheDocument();
  });

  it('renders all required form fields', () => {
    renderWithProviders(<ReferralPage />);
    expect(screen.getByText('Visit UUID *')).toBeInTheDocument();
    expect(screen.getByText('Employee ID *')).toBeInTheDocument();
    expect(screen.getByText('Priority *')).toBeInTheDocument();
    expect(screen.getByText('Referral Reason *')).toBeInTheDocument();
  });

  it('renders Cancel and Create Referral buttons', () => {
    renderWithProviders(<ReferralPage />);
    expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Referral/ })).toBeInTheDocument();
  });

  it('shows error when required fields are empty', async () => {
    const { container } = renderWithProviders(<ReferralPage />);
    const form = container.querySelector('form');
    fireEvent.submit(form!);
    await waitFor(() => {
      expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
    });
  });

  it('navigates to dashboard on cancel', () => {
    renderWithProviders(<ReferralPage />);
    fireEvent.click(screen.getByRole('button', { name: /Cancel/ }));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('renders specialist department field', () => {
    renderWithProviders(<ReferralPage />);
    expect(screen.getByText('Specialist Department')).toBeInTheDocument();
  });

  it('renders Referral Information section', () => {
    renderWithProviders(<ReferralPage />);
    expect(screen.getByText('Referral Information')).toBeInTheDocument();
  });

  it('renders Diagnosis ID field', () => {
    renderWithProviders(<ReferralPage />);
    expect(screen.getByText('Diagnosis ID')).toBeInTheDocument();
  });
});
