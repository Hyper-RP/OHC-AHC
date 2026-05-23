import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockVisit, mockUser, mockPaginatedResponse } from '../../../tests/test-utils';
import { DoctorDashboard } from '../DoctorDashboard';
import * as ohcService from '../../services/ohc';

const mockNavigate = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: mockUser({ role: 'DOCTOR' }),
    isAuthenticated: true,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
  })),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../../services/ohc', () => ({
  listVisits: vi.fn(),
  createDiagnosis: vi.fn(),
}));

vi.mock('../../../contexts/SnackbarContext', () => ({
  useSnackbar: vi.fn(() => ({
    show: vi.fn(),
    messages: [],
    removeMessage: vi.fn(),
  })),
}));

describe('DoctorDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(ohcService, 'listVisits').mockResolvedValue(
      mockPaginatedResponse([
        mockVisit({
          id: 1,
          visit_status: 'OPEN',
        }),
      ])
    );
  });

  describe('Rendering', () => {
    it('renders page header', async () => {
      renderWithProviders(<DoctorDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Doctor Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Manage your assigned patient visits')).toBeInTheDocument();
      });
    });

    it('shows loading state initially', () => {
      vi.spyOn(ohcService, 'listVisits').mockImplementation(() => new Promise(() => {}));
      renderWithProviders(<DoctorDashboard />);
      expect(screen.getByText('Loading visits...')).toBeInTheDocument();
    });

    it('renders visits list when data is loaded', async () => {
      renderWithProviders(<DoctorDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Assigned Visits')).toBeInTheDocument();
        expect(screen.getByText('1 visit')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('shows empty state when no visits', async () => {
      vi.spyOn(ohcService, 'listVisits').mockResolvedValue(
        mockPaginatedResponse([])
      );
      renderWithProviders(<DoctorDashboard />);
      await waitFor(() => {
        expect(screen.getByText('No visits assigned to you.')).toBeInTheDocument();
        expect(screen.getByText('Create a new visit from the OHC Visit Form to get started.')).toBeInTheDocument();
      });
    });

    it('displays error message when fetch fails', async () => {
      vi.spyOn(ohcService, 'listVisits').mockRejectedValue(
        new Error('Network error')
      );
      renderWithProviders(<DoctorDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Visit Details', () => {
    it('opens visit details when clicking a visit card', async () => {
      renderWithProviders(<DoctorDashboard />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('John Doe'));
      });
      await waitFor(() => {
        expect(screen.getByText('Visit Details')).toBeInTheDocument();
        expect(screen.getByText('Close')).toBeInTheDocument();
      });
    });

    it('displays patient information correctly', async () => {
      renderWithProviders(<DoctorDashboard />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('John Doe'));
      });
      await waitFor(() => {
        expect(screen.getByText('Patient:')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Employee Code:')).toBeInTheDocument();
        expect(screen.getByText('EMP-001')).toBeInTheDocument();
        expect(screen.getByText('Department:')).toBeInTheDocument();
      });
    });

    it('displays vital signs', async () => {
      renderWithProviders(<DoctorDashboard />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('John Doe'));
      });
      await waitFor(() => {
        expect(screen.getByText('Vital Signs')).toBeInTheDocument();
        expect(screen.getByText('temperature:')).toBeInTheDocument();
        expect(screen.getByText('98.6')).toBeInTheDocument();
      });
    });

    it('shows Add Diagnosis button for OPEN visits', async () => {
      renderWithProviders(<DoctorDashboard />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('John Doe'));
      });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Add Diagnosis' })).toBeInTheDocument();
      });
    });

    it('closes visit details when Close button is clicked', async () => {
      renderWithProviders(<DoctorDashboard />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('John Doe'));
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      });
      await waitFor(() => {
        expect(screen.queryByText('Visit Details')).not.toBeInTheDocument();
      });
    });
  });

  describe('Diagnosis Form', () => {
    it('shows diagnosis form when Add Diagnosis is clicked', async () => {
      renderWithProviders(<DoctorDashboard />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('John Doe'));
        fireEvent.click(screen.getByRole('button', { name: 'Add Diagnosis' }));
      });
      await waitFor(() => {
        expect(screen.getByText('Diagnosis')).toBeInTheDocument();
        expect(screen.getByText('Diagnosis Name *')).toBeInTheDocument();
        expect(screen.getByText('Diagnosis Code (Optional)')).toBeInTheDocument();
        expect(screen.getByText('Diagnosis Notes (Optional)')).toBeInTheDocument();
      });
    });

    it('shows all diagnosis input fields', async () => {
      renderWithProviders(<DoctorDashboard />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('John Doe'));
        fireEvent.click(screen.getByRole('button', { name: 'Add Diagnosis' }));
      });
      await waitFor(() => {
        expect(screen.getByText('Severity')).toBeInTheDocument();
        expect(screen.getByText('Fitness Decision')).toBeInTheDocument();
        expect(screen.getByText('Advised Rest Days')).toBeInTheDocument();
        expect(screen.getByText('Follow-up Date (Optional)')).toBeInTheDocument();
        expect(screen.getByText('Work Restrictions (Optional)')).toBeInTheDocument();
      });
    });

    it('has correct severity options', async () => {
      renderWithProviders(<DoctorDashboard />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('John Doe'));
        fireEvent.click(screen.getByRole('button', { name: 'Add Diagnosis' }));
      });
      await waitFor(() => {
        const severitySelect = screen.getByLabelText('Severity');
        expect(screen.getByText('Mild')).toBeInTheDocument();
        expect(screen.getByText('Moderate')).toBeInTheDocument();
        expect(screen.getByText('Serious')).toBeInTheDocument();
        expect(screen.getByText('Critical')).toBeInTheDocument();
      });
    });

    it('has correct fitness decision options', async () => {
      renderWithProviders(<DoctorDashboard />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('John Doe'));
        fireEvent.click(screen.getByRole('button', { name: 'Add Diagnosis' }));
      });
      await waitFor(() => {
        const fitnessSelect = screen.getByLabelText('Fitness Decision');
        expect(screen.getByText('Fit')).toBeInTheDocument();
        expect(screen.getByText('Fit With Restriction')).toBeInTheDocument();
        expect(screen.getByText('Temporary Unfit')).toBeInTheDocument();
        expect(screen.getByText('Unfit')).toBeInTheDocument();
      });
    });
  });

  describe('Prescriptions', () => {
    it('shows prescriptions section', async () => {
      renderWithProviders(<DoctorDashboard />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('John Doe'));
        fireEvent.click(screen.getByRole('button', { name: 'Add Diagnosis' }));
      });
      await waitFor(() => {
        expect(screen.getByText('Prescriptions')).toBeInTheDocument();
        expect(screen.getByText('Medicine Name *')).toBeInTheDocument();
        expect(screen.getByText('Dosage *')).toBeInTheDocument();
        expect(screen.getByText('Frequency *')).toBeInTheDocument();
        expect(screen.getByText('Duration (days) *')).toBeInTheDocument();
        expect(screen.getByText('Route (Optional)')).toBeInTheDocument();
        expect(screen.getByText('Instructions (Optional)')).toBeInTheDocument();
      });
    });

    it('allows adding multiple prescriptions', async () => {
      renderWithProviders(<DoctorDashboard />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('John Doe'));
        fireEvent.click(screen.getByRole('button', { name: 'Add Diagnosis' }));
        fireEvent.click(screen.getByRole('button', { name: '+ Add Prescription' }));
      });
      await waitFor(() => {
        expect(screen.getByText('Prescription 2')).toBeInTheDocument();
      });
    });

    it('removes prescription when × button is clicked', async () => {
      renderWithProviders(<DoctorDashboard />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('John Doe'));
        fireEvent.click(screen.getByRole('button', { name: 'Add Diagnosis' }));
        fireEvent.click(screen.getByRole('button', { name: '+ Add Prescription' }));
      });
      await waitFor(() => {
        expect(screen.getByText('Prescription 2')).toBeInTheDocument();
      });

      const removeButtons = screen.getAllByText('×');
      fireEvent.click(removeButtons[0]);
      await waitFor(() => {
        expect(screen.queryByText('Prescription 2')).not.toBeInTheDocument();
      });
    });

    it('keeps at least one prescription (cannot remove last one)', async () => {
      renderWithProviders(<DoctorDashboard />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('John Doe'));
        fireEvent.click(screen.getByRole('button', { name: 'Add Diagnosis' }));
      });
      await waitFor(() => {
        expect(screen.getByText('Medicine Name *')).toBeInTheDocument();
      });

      const removeButtons = screen.queryAllByText('×');
      expect(removeButtons.length).toBe(0);
    });
  });

  describe('Form Validation', () => {
    it('shows error when diagnosis name is empty', async () => {
      const { show } = vi.spyOn(vi.importActual('../../../contexts/SnackbarContext'), 'useSnackbar')().getReturnValue({
        show: vi.fn(),
      });

      renderWithProviders(<DoctorDashboard />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('John Doe'));
        fireEvent.click(screen.getByRole('button', { name: 'Add Diagnosis' }));
        fireEvent.click(screen.getByRole('button', { name: 'Submit Diagnosis' }));
      });
      await waitFor(() => {
        expect(show).toHaveBeenCalledWith('Please correct the errors in vitals', 'error');
      });
    });

    it('shows error when no prescription is provided', async () => {
      renderWithProviders(<DoctorDashboard />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('John Doe'));
        fireEvent.click(screen.getByRole('button', { name: 'Add Diagnosis' }));

        // Clear medicine name
        const medicineInput = screen.getByLabelText('Medicine Name *');
        await userEvent.clear(medicineInput);

        fireEvent.click(screen.getByRole('button', { name: 'Submit Diagnosis' }));
      });
      await waitFor(() => {
        expect(screen.getByText(/Please correct the errors in vitals/)).toBeInTheDocument();
      });
    });

    it('shows error for invalid follow-up date', async () => {
      renderWithProviders(<DoctorDashboard />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('John Doe'));
        fireEvent.click(screen.getByRole('button', { name: 'Add Diagnosis' }));

        const medicineInput = screen.getByLabelText('Medicine Name *');
        await userEvent.type(medicineInput, 'Paracetamol');

        const dosageInput = screen.getByLabelText('Dosage *');
        await userEvent.type(dosageInput, '500mg');

        const frequencyInput = screen.getByLabelText('Frequency *');
        await userEvent.type(frequencyInput, '3 times daily');

        const diagnosisNameInput = screen.getByLabelText('Diagnosis Name *');
        await userEvent.type(diagnosisNameInput, 'Headache');

        const followUpInput = screen.getByLabelText('Follow-up Date (Optional)');
        await userEvent.type(followUpInput, '2025-01-01');

        fireEvent.click(screen.getByRole('button', { name: 'Submit Diagnosis' }));
      });
      await waitFor(() => {
        expect(screen.getByText(/Follow-up date cannot be in the past/)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits diagnosis successfully', async () => {
      const { show } = vi.spyOn(vi.importActual('../../../contexts/SnackbarContext'), 'useSnackbar')().getReturnValue({
        show: vi.fn(),
      });

      vi.spyOn(ohcService, 'createDiagnosis').mockResolvedValue({
        diagnosis: { id: 1, diagnosis_name: 'Headache' },
        prescriptions: [{ id: 1, medicine_name: 'Paracetamol' }],
        visit_status: 'COMPLETED',
      });

      renderWithProviders(<DoctorDashboard />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('John Doe'));
        fireEvent.click(screen.getByRole('button', { name: 'Add Diagnosis' }));

        const medicineInput = screen.getByLabelText('Medicine Name *');
        await userEvent.type(medicineInput, 'Paracetamol');

        const dosageInput = screen.getByLabelText('Dosage *');
        await userEvent.type(dosageInput, '500mg');

        const frequencyInput = screen.getByLabelText('Frequency *');
        await userEvent.type(frequencyInput, '3 times daily');

        const diagnosisNameInput = screen.getByLabelText('Diagnosis Name *');
        await userEvent.type(diagnosisNameInput, 'Headache');

        fireEvent.click(screen.getByRole('button', { name: 'Submit Diagnosis' }));
      });
      await waitFor(() => {
        expect(show).toHaveBeenCalledWith('Diagnosis and prescriptions submitted successfully!', 'success');
      });
    });

    it('shows error when submission fails', async () => {
      const { show } = vi.spyOn(vi.importActual('../../../contexts/SnackbarContext'), 'useSnackbar')().getReturnValue({
        show: vi.fn(),
      });

      vi.spyOn(ohcService, 'createDiagnosis').mockRejectedValue(
        new Error('Failed to submit diagnosis')
      );

      renderWithProviders(<DoctorDashboard />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('John Doe'));
        fireEvent.click(screen.getByRole('button', { name: 'Add Diagnosis' }));

        const medicineInput = screen.getByLabelText('Medicine Name *');
        await userEvent.type(medicineInput, 'Paracetamol');

        const dosageInput = screen.getByLabelText('Dosage *');
        await userEvent.type(dosageInput, '500mg');

        const frequencyInput = screen.getByLabelText('Frequency *');
        await userEvent.type(frequencyInput, '3 times daily');

        const diagnosisNameInput = screen.getByLabelText('Diagnosis Name *');
        await userEvent.type(diagnosisNameInput, 'Headache');

        fireEvent.click(screen.getByRole('button', { name: 'Submit Diagnosis' }));
      });
      await waitFor(() => {
        expect(screen.getByText('Failed to submit diagnosis')).toBeInTheDocument();
        expect(show).toHaveBeenCalledWith('Failed to submit diagnosis', 'error');
      });
    });

    it('disables submit button while submitting', async () => {
      vi.spyOn(ohcService, 'createDiagnosis').mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({}), 1000))
      );

      renderWithProviders(<DoctorDashboard />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('John Doe'));
        fireEvent.click(screen.getByRole('button', { name: 'Add Diagnosis' }));

        const medicineInput = screen.getByLabelText('Medicine Name *');
        await userEvent.type(medicineInput, 'Paracetamol');

        const dosageInput = screen.getByLabelText('Dosage *');
        await userEvent.type(dosageInput, '500mg');

        const frequencyInput = screen.getByLabelText('Frequency *');
        await userEvent.type(frequencyInput, '3 times daily');

        const diagnosisNameInput = screen.getByLabelText('Diagnosis Name *');
        await userEvent.type(diagnosisNameInput, 'Headache');

        fireEvent.click(screen.getByRole('button', { name: 'Submit Diagnosis' }));
      });

      const submitButton = screen.getByRole('button', { name: 'Submit Diagnosis' });
      expect(submitButton).toBeDisabled();
    });

    it('closes form after successful submission', async () => {
      const { show } = vi.spyOn(vi.importActual('../../../contexts/SnackbarContext'), 'useSnackbar')().getReturnValue({
        show: vi.fn(),
      });

      vi.spyOn(ohcService, 'createDiagnosis').mockResolvedValue({
        diagnosis: { id: 1, diagnosis_name: 'Headache' },
        prescriptions: [{ id: 1, medicine_name: 'Paracetamol' }],
        visit_status: 'COMPLETED',
      });

      renderWithProviders(<DoctorDashboard />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('John Doe'));
        fireEvent.click(screen.getByRole('button', { name: 'Add Diagnosis' }));

        const medicineInput = screen.getByLabelText('Medicine Name *');
        await userEvent.type(medicineInput, 'Paracetamol');

        const dosageInput = screen.getByLabelText('Dosage *');
        await userEvent.type(dosageInput, '500mg');

        const frequencyInput = screen.getByLabelText('Frequency *');
        await userEvent.type(frequencyInput, '3 times daily');

        const diagnosisNameInput = screen.getByLabelText('Diagnosis Name *');
        await userEvent.type(diagnosisNameInput, 'Headache');

        fireEvent.click(screen.getByRole('button', { name: 'Submit Diagnosis' }));
      });
      await waitFor(() => {
        expect(screen.queryByText('Visit Details')).not.toBeInTheDocument();
      });
    });
  });

  describe('Field Error Handling', () => {
    it('clears field error when user starts typing', async () => {
      renderWithProviders(<DoctorDashboard />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('John Doe'));
        fireEvent.click(screen.getByRole('button', { name: 'Add Diagnosis' }));

        const diagnosisNameInput = screen.getByLabelText('Diagnosis Name *');
        await userEvent.type(diagnosisNameInput, 'a');
        await userEvent.clear(diagnosisNameInput);
        await userEvent.type(diagnosisNameInput, 'Headache');
      });
      await waitFor(() => {
        expect(screen.queryByText(/Diagnosis name is required/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Cancel Action', () => {
    it('closes form when Cancel is clicked', async () => {
      renderWithProviders(<DoctorDashboard />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('John Doe'));
        fireEvent.click(screen.getByRole('button', { name: 'Add Diagnosis' }));
        expect(screen.getByText('Diagnosis')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      });
      await waitFor(() => {
        expect(screen.queryByText('Diagnosis')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Add Diagnosis' })).toBeInTheDocument();
      });
    });
  });

  describe('Access Control', () => {
    it('redirects non-doctor users to dashboard', () => {
      vi.importActual('../../../contexts/AuthContext').useAuth.mockReturnValue({
        user: mockUser({ role: 'EMPLOYEE' }),
        isAuthenticated: true,
        loading: false,
      });
      renderWithProviders(<DoctorDashboard />);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
