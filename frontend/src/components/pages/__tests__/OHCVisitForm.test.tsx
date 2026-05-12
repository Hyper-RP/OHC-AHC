import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../tests/test-utils';
import { OHCVisitForm } from '../OHCVisitForm';

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

vi.mock('../../../services/ohc', () => ({
  createVisit: vi.fn(),
}));

describe('OHCVisitForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page header', () => {
    renderWithProviders(<OHCVisitForm />);
    expect(screen.getByText('Patient Information')).toBeInTheDocument();
  });

  it('renders chief complaint section', () => {
    renderWithProviders(<OHCVisitForm />);
    expect(screen.getByText('Chief Complaint & Symptoms')).toBeInTheDocument();
  });

  it('renders vital signs section', () => {
    renderWithProviders(<OHCVisitForm />);
    expect(screen.getByText('Vital Signs')).toBeInTheDocument();
  });

  it('renders additional information section', () => {
    renderWithProviders(<OHCVisitForm />);
    expect(screen.getByText('Additional Information')).toBeInTheDocument();
  });

  it('renders medicine given to patient section', () => {
    renderWithProviders(<OHCVisitForm />);
    expect(screen.getByText('Medicine Given to Patient')).toBeInTheDocument();
  });

  it('renders Cancel and Create Visit buttons', () => {
    renderWithProviders(<OHCVisitForm />);
    expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Visit/ })).toBeInTheDocument();
  });

  it('shows error when required fields are empty on submit', async () => {
    const { container } = renderWithProviders(<OHCVisitForm />);
    const form = container.querySelector('form');
    fireEvent.submit(form!);
    await waitFor(() => {
      expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
    });
  });

  it('navigates to dashboard on cancel', () => {
    renderWithProviders(<OHCVisitForm />);
    fireEvent.click(screen.getByRole('button', { name: /Cancel/ }));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('renders employee code input', () => {
    renderWithProviders(<OHCVisitForm />);
    expect(screen.getByText('Employee Code *')).toBeInTheDocument();
  });


  it('renders vital fields with helper text', () => {
    renderWithProviders(<OHCVisitForm />);
    expect(screen.getByText(/Valid range: 80-120°F/)).toBeInTheDocument();
    expect(screen.getByText(/Format: 120\/80/)).toBeInTheDocument();
  });

  it('renders visit type and triage level selects', () => {
    renderWithProviders(<OHCVisitForm />);
    expect(screen.getByText('Visit Type *')).toBeInTheDocument();
    expect(screen.getByText('Triage Level *')).toBeInTheDocument();
  });
});
