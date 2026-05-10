import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../tests/test-utils';
import { DiagnosisEntry } from '../DiagnosisEntry';

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
  createDiagnosis: vi.fn(),
}));

describe('DiagnosisEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page header', () => {
    renderWithProviders(<DiagnosisEntry />);
    expect(screen.getByText('Visit Information')).toBeInTheDocument();
  });

  it('renders diagnosis details section', () => {
    renderWithProviders(<DiagnosisEntry />);
    expect(screen.getByText('Diagnosis Details')).toBeInTheDocument();
  });

  it('renders severity & status section', () => {
    renderWithProviders(<DiagnosisEntry />);
    expect(screen.getByText('Severity & Status')).toBeInTheDocument();
  });

  it('renders fitness assessment section', () => {
    renderWithProviders(<DiagnosisEntry />);
    expect(screen.getByText('Fitness Assessment')).toBeInTheDocument();
  });

  it('renders prescriptions section', () => {
    renderWithProviders(<DiagnosisEntry />);
    expect(screen.getByText('Prescriptions')).toBeInTheDocument();
    expect(screen.getByText('Prescription 1')).toBeInTheDocument();
  });

  it('renders Cancel and Create Diagnosis buttons', () => {
    renderWithProviders(<DiagnosisEntry />);
    expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Diagnosis/ })).toBeInTheDocument();
  });

  it('shows error when required fields are empty on submit', async () => {
    const { container } = renderWithProviders(<DiagnosisEntry />);
    const form = container.querySelector('form');
    fireEvent.submit(form!);
    await waitFor(() => {
      expect(screen.getByText('Please provide visit ID and diagnosis name')).toBeInTheDocument();
    });
  });

  it('navigates to dashboard on cancel', () => {
    renderWithProviders(<DiagnosisEntry />);
    fireEvent.click(screen.getByRole('button', { name: /Cancel/ }));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('adds a new prescription when add button is clicked', () => {
    renderWithProviders(<DiagnosisEntry />);
    fireEvent.click(screen.getByRole('button', { name: /Add Prescription/ }));
    expect(screen.getByText('Prescription 2')).toBeInTheDocument();
  });

  it('removes a prescription when remove is clicked', () => {
    renderWithProviders(<DiagnosisEntry />);
    fireEvent.click(screen.getByRole('button', { name: /Add Prescription/ }));
    expect(screen.getByText('Prescription 2')).toBeInTheDocument();

    const removeButtons = screen.getAllByRole('button', { name: /Remove/ });
    fireEvent.click(removeButtons[0]);
    expect(screen.queryByText('Prescription 2')).not.toBeInTheDocument();
  });

  it('renders diagnosis code and name fields', () => {
    renderWithProviders(<DiagnosisEntry />);
    expect(screen.getByText('Diagnosis Code')).toBeInTheDocument();
    expect(screen.getByText('Diagnosis Name *')).toBeInTheDocument();
  });

  it('renders fitness decision select', () => {
    renderWithProviders(<DiagnosisEntry />);
    expect(screen.getByText('Fitness Decision *')).toBeInTheDocument();
  });
});
