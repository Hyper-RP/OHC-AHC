import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUser, mockVisit } from '../../../tests/test-utils';
import { createVisit, handleApiError } from '../../services/ohc';

const mockNavigate = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: mockUser({ role: 'NURSE' }),
    isAuthenticated: true,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
  })),
}));

vi.mock('../../../contexts/SnackbarContext', () => ({
  useSnackbar: vi.fn(() => ({
    show: vi.fn(),
    messages: [],
    removeMessage: vi.fn(),
  })),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../services/ohc', () => ({
  fetch: vi.fn(),
  createVisit: vi.fn().mockResolvedValue({ id: 1 }),
}));

describe('NurseVisitForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(mockNavigate, 'mockReturnValue');
  });

  describe('Rendering', () => {
    it('renders page header', async () => {
      renderWithProviders(<NurseVisitForm />);
      await waitFor(() => {
        expect(screen.getByText('Nurse Visit Form')).toBeInTheDocument();
        expect(screen.getByText('Record employee visit and assign to doctor')).toBeInTheDocument();
      });
    });

    it('renders all form sections', async () => {
      renderWithProviders(<NurseVisitForm />);
      await waitFor(() => {
        expect(screen.getByText('Employee Information')).toBeInTheDocument();
        expect(screen.getByText('Vital Signs')).toBeInTheDocument();
        expect(screen.getByText('Visit Details')).toBeInTheDocument();
        expect(screen.getByText('Assign to Doctor')).toBeInTheDocument();
      });
    });

    it('displays form grid layout', async () => {
      renderWithProviders(<NurseVisitForm />);
      await waitFor(() => {
        const formGrid = screen.getByRole('form')?.className;
        expect(formGrid).toBeInTheDocument();
      });
    });

    it('shows loading state', async () => {
      const { fetchDoctorOptions } = await import('../../services/ohc');
      vi.spyOn(fetchDoctorOptions, 'mockImplementation', () => {
        vi.fn().mockImplementation(() => {
          // Simulate loading
          return new Promise((resolve) => setTimeout(resolve, 1000));
        });
      });

      renderWithProviders(<NurseVisitForm />);
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
    });

    it('displays error message', async () => {
      renderWithProviders(<NurseVisitForm />);
      await waitFor(() => {
        expect(screen.queryByText('Please select an employee')).not.toBeInTheDocument();
      });
    });

    it('renders submit and cancel buttons', async () => {
      renderWithProviders(<NurseVisitForm />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Create Visit/i })).toBeInTheDocument();
      });
    });
  });

  describe('Employee Information Form', () => {
    it('renders employee ID input', async () => {
      renderWithProviders(<NurseVisitForm />);
      await waitFor(() => {
        expect(screen.getByLabelText('Employee ID')).toBeInTheDocument();
      });
    });

    it('renders all vital signs inputs', async () => {
      renderWithProviders(<NurseVisitForm />);
      await waitFor(() => {
        expect(screen.getByLabelText('Temperature (°F)')).toBeInTheDocument();
        expect(screen.getByLabelText('Blood Pressure')).toBeInTheDocument();
        expect(screen.getByLabelText('Pulse (bpm)')).toBeInTheDocument();
        expect(screen.getByLabelText('SpO2 (%)')).toBeInTheDocument();
        expect(screen.getByLabelText('Weight (kg)')).toBeInTheDocument();
        expect(screen.getByLabelText('Height (cm)')).toBeInTheDocument();
      });
    });

    it('shows vitals errors for invalid values', async () => {
      renderWithProviders(<NurseVisitForm />);

      const tempInput = screen.getByLabelText('Temperature (°F)');
      await userEvent.type(tempInput, '150');

      const submitButton = screen.getByRole('button', { name: /Create Visit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Temperature must be between 80-120°F')).toBeInTheDocument();
      });
    });

    it('clears vitals errors on valid input', async () => {
      renderWithProviders(<NurseVisitForm />);

      const tempInput = screen.getByLabelText('Temperature (°F)');
      await userEvent.type(tempInput, '98');

      const submitButton = screen.getByRole('button', { name: /Create Visit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Temperature must be between 80-120°F')).not.toBeInTheDocument();
      });
    });
  });

  describe('Visit Details Form', () => {
    it('renders all visit type options', async () => {
      renderWithProviders(<NurseVisitForm />);
      await waitFor(() => {
        expect(screen.getByLabelText('Visit Type')).toBeInTheDocument();
        const select = screen.getByRole('combobox', { name: 'Visit Type' });
        expect(select).toBeInTheDocument();
        const options = screen.getAllByRole('option');
        expect(options.length).toBe(4);
        expect(options[0]).toHaveText('Walk In');
        expect(options[1]).toHaveText('Periodic');
        expect(options[2]).toHaveText('Pre-Employment');
        expect(options[3]).toHaveText('Follow Up');
      });
    });

    it('renders triage level options', async () => {
      renderWithProviders(<NurseVisitForm />);
      await waitFor(() => {
        expect(screen.getByLabelText('Triage Level')).toBeInTheDocument();
        const select = screen.getByRole('combobox', { name: 'Triage Level' });
        expect(select).toBeInTheDocument();
        const options = screen.getAllByRole('option');
        expect(options.length).toBe(4);
        expect(options[0]).toHaveText('Low');
        expect(options[1]).toHaveText('Medium');
        expect(options[2]).toHaveText('High');
        expect(options[3]).toHaveText('Critical');
      });
    });

    it('renders visit date input', async () => {
      renderWithProviders(<NurseVisitForm />);
      await waitFor(() => {
        expect(screen.getByLabelText('Visit Date')).toBeInTheDocument();
        const dateInput = screen.getByRole('textbox', { name: 'Visit Date' });
        expect(dateInput).toBeInTheDocument();
      });
    });
  });

  describe('Doctor Selection', () => {
    it('loads and displays doctor options', async () => {
      const { fetchDoctorOptions } = await import('../../services/ohc');

      const mockDoctors = [
        { id: 1, user: { first_name: 'Dr. Sarah', last_name: 'Smith' }, registration_number: 'DOC-001', specializations: 'General Medicine' },
        { id: 2, user: { first_name: 'Dr. John', last_name: 'Doe' }, registration_number: 'DOC-002', specializations: 'Cardiology' },
        { id: 3, user: { first_name: 'Dr. Emily', last_name: 'Johnson' }, registration_number: 'DOC-003', specializations: 'Orthopedics' },
      ];

      vi.spyOn(fetchDoctorOptions, 'mockImplementation', () => {
        return new Promise((resolve) => resolve({ json: mockDoctors }));
      });

      renderWithProviders(<NurseVisitForm />);

      await waitFor(() => {
        const select = screen.getByRole('combobox', { name: 'Select Doctor' });
        const options = screen.getAllByRole('option');
        expect(options.length).toBe(4);
        expect(options[0]).toHaveText('Dr. Sarah Smith (DOC-001) - General Medicine');
        expect(options[1]).toHaveText('Dr. John Doe (DOC-002) - Cardiology');
        expect(options[2]).toHaveText('Dr. Emily Johnson (DOC-003) - Orthopedics');
      });
    });

    it('shows default option when no doctor selected', async () => {
      renderWithProviders(<NurseVisitForm />);
      await waitFor(() => {
        const select = screen.getByRole('combobox', { name: 'Select Doctor' });
        const options = screen.getAllByRole('option');
        expect(options[0]).toHaveText('Select a doctor');
      });
    });

    it('selects doctor from dropdown', async () => {
      const { fetchDoctorOptions } = await import('../../services/ohc');

      const mockDoctors = [
        { id: 1, user: { first_name: 'Dr. Sarah', last_name: 'Smith' }, registration_number: 'DOC-001', specializations: 'General Medicine' },
      ];

      vi.spyOn(fetchDoctorOptions, 'mockImplementation', () => {
        return new Promise((resolve) => resolve({ json: mockDoctors }));
      });

      renderWithProviders(<NurseVisitForm />);

      await waitFor(() => {
        const select = screen.getByRole('combobox', { name: 'Select Doctor' });
        const options = screen.getAllByRole('option');
        fireEvent.click(options[0]);
        const selectedOption = await waitFor(() => screen.getByRole('option', { selected: true }));
        expect(selectedOption).toHaveText('Dr. Sarah Smith (DOC-001) - General Medicine');
      });
    });
  });

  describe('Additional Visit Details', () => {
    it('renders chief complaint input', async () => {
      renderWithProviders(<NurseVisitForm />);
      await waitFor(() => {
        expect(screen.getByLabelText('Chief Complaint')).toBeInTheDocument();
        const textarea = screen.getByRole('textbox', { name: 'Chief Complaint' });
        expect(textarea).toBeInTheDocument();
      });
    });

    it('renders symptoms textarea', async () => {
      renderWithProviders(<NurseVisitForm />);
      await waitFor(() => {
        expect(screen.getByLabelText('Symptoms')).toBeInTheDocument();
        const textarea = screen.getByRole('textbox', { name: 'Symptoms' });
        expect(textarea).toBeInTheDocument();
      });
    });

    it('renders preliminary notes textarea', async () => {
      renderWithProviders(<NurseVisitForm />);
      await waitFor(() => {
        expect(screen.getByLabelText('Preliminary Notes')).toBeInTheDocument();
        const textarea = screen.getByRole('textbox', { name: 'Preliminary Notes' });
        expect(textarea).toBeInTheDocument();
      });
    });
  });

  describe('Referral and Follow-up', () => {
    it('renders requires referral dropdown', async () => {
      renderWithProviders(<NurseVisitForm />);
      await waitFor(() => {
        expect(screen.getByLabelText('Requires Referral?')).toBeInTheDocument();
        const select = screen.getByRole('combobox', { name: 'Requires Referral?' });
        expect(select).toBeInTheDocument();
        const options = screen.getAllByRole('option');
        expect(options.length).toBe(2);
        expect(options[0]).toHaveText('No');
        expect(options[1]).toHaveText('Yes');
      });
    });

    it('renders follow-up date input', async () => {
      renderWithProviders(<NurseVisitForm />);
      await waitFor(() => {
        expect(screen.getByLabelText('Follow-up Date')).toBeInTheDocument();
        const dateInput = screen.getByRole('textbox', { name: 'Follow-up Date' });
        expect(dateInput).toBeInTheDocument();
      });
    });

    it('renders next action input', async () => {
      renderWithProviders(<NurseVisitForm />);
      await waitFor(() => {
        expect(screen.getByLabelText('Next Action')).toBeInTheDocument();
        const textarea = screen.getByRole('textbox', { name: 'Next Action' });
        expect(textarea).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('shows error when employee ID is empty on submit', async () => {
      const { show } = vi.spyOn(vi.importActual('../../../contexts/SnackbarContext'), 'useSnackbar').mockReturnValue({
        show: vi.fn(),
      }).getReturnValue({ show });

      renderWithProviders(<NurseVisitForm />);

      const submitButton = screen.getByRole('button', { name: /Create Visit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please select an employee')).toBeInTheDocument();
        expect(show).toHaveBeenCalledWith('Please select an employee', 'error');
      });
    });

    it('shows error when doctor not selected on submit', async () => {
      const { show } = vi.spyOn(vi.importActual('../../../contexts/SnackbarContext'), 'useSnackbar').mockReturnValue({
        show: vi.fn(),
      }).getReturnValue({ show });

      renderWithProviders(<NurseVisitForm />);

      const submitButton = screen.getByRole('button', { name: /Create Visit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please assign a doctor')).toBeInTheDocument();
        expect(show).toHaveBeenCalledWith('Please assign a doctor', 'error');
      });
    });

    it('shows error when chief complaint is empty on submit', async () => {
      const { show } = vi.spyOn(vi.importActual('../../../contexts/SnackbarContext'), 'useSnackbar').mockReturnValue({
        show: vi.fn(),
      }).getReturnValue({ show });

      renderWithProviders(<NurseVisitForm />);

      const submitButton = screen.getByRole('button', { name: /Create Visit/i });

      const chiefComplaintInput = screen.getByLabelText('Chief Complaint');
      await userEvent.clear(chiefComplaintInput);

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Chief complaint is required')).toBeInTheDocument();
        expect(show).toHaveBeenCalledWith('Please enter chief complaint', 'error');
      });
    });

    it('validates temperature out of range (80-120)', async () => {
      const { show } = vi.spyOn(vi.importActual('../../../contexts/SnackbarContext'), 'useSnackbar').mockReturnValue({
        show: vi.fn(),
      }).getReturnValue({ show });

      renderWithProviders(<NurseVisitForm />);

      const tempInput = screen.getByLabelText('Temperature (°F)');
      await userEvent.type(tempInput, '150');

      const submitButton = screen.getByRole('button', { name: /Create Visit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Temperature must be between 80-120°F')).toBeInTheDocument();
      });
    });

    it('validates temperature below minimum range (<80)', async () => {
      const { show } = vi.spyOn(vi.importActual('../../../contexts/SnackbarContext'), 'useSnackbar').mockReturnValue({
        show: vi.fn(),
      }).getReturnValue({ show });

      renderWithProviders(<NurseVisitForm />);

      const tempInput = screen.getByLabelText('Temperature (°F)');
      await userEvent.type(tempInput, '70');

      const submitButton = screen.getByRole('button', { name: /Create Visit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Temperature must be between 80-120°F')).toBeInTheDocument();
      });
    });

    it('validates blood pressure format (120/80)', async () => {
      const { show } = vi.spyOn(vi.importActual('../../../contexts/SnackbarContext'), 'useSnackbar').mockReturnValue({
        show: vi.fn(),
      }).getReturnValue({ show });

      renderWithProviders(<NurseVisitForm />);

      const bpInput = screen.getByLabelText('Blood Pressure');
      await userEvent.type(bpInput, '120/90');

      const submitButton = screen.getByRole('button', { name: /Create Visit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid blood pressure format')).toBeInTheDocument();
      });
    });

    it('clears vitals errors on valid input', async () => {
      const { show } = vi.spyOn(vi.importActual('../../../contexts/SnackbarContext'), 'useSnackbar').mockReturnValue({
        show: vi.fn(),
      }).getReturnValue({ show });

      renderWithProviders(<NurseVisitForm />);

      const tempInput = screen.getByLabelText('Temperature (°F)');
      await userEvent.type(tempInput, '98');

      await waitFor(() => {
        expect(screen.queryByText('Temperature must be between 80-120°F')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid data successfully', async () => {
      const { createVisit } = await import('../../services/ohc');
      vi.mocked(createVisit).mockResolvedValue({ id: 1 });

      const { show } = vi.spyOn(vi.importActual('../../../contexts/SnackbarContext'), 'useSnackbar').mockReturnValue({
        show: vi.fn(),
      }).getReturnValue({ show });

      renderWithProviders(<NurseVisitForm />);

      const employeeIdInput = screen.getByLabelText('Employee ID');
      await userEvent.type(employeeIdInput, 'EMP001');

      const submitButton = screen.getByRole('button', { name: /Create Visit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(createVisit).toHaveBeenCalledWith({
          employee_id: 1,
          visited_by: expect.any(Number),
          visited_at: expect.any(String),
          visit_type: 'WALK_IN',
          triage_level: 'LOW',
          visit_date: expect.any(String),
          chief_complaint: 'Headache',
          symptoms: 'Mild pain',
          vitals: { temperature: '98.6', blood_pressure: '120/80', pulse: '72', spo2: '98', weight: '70', height: '175' },
          preliminary_notes: '',
          requires_referral: false,
          follow_up_date: null,
          next_action: '',
        });
        expect(show).toHaveBeenCalledWith('Visit created successfully!', 'success');
        expect(mockNavigate).toHaveBeenCalledWith('/doctor/dashboard');
      });
    });

    it('handles submission errors gracefully', async () => {
      const { createVisit, handleApiError } = await import('../../services/ohc');
      vi.mocked(createVisit).mockRejectedValue(new Error('API Error'));

      const { show } = vi.spyOn(vi.importActual('../../../contexts/SnackbarContext'), 'useSnackbar').mockReturnValue({
        show: vi.fn(),
      }).getReturnValue({ show });

      renderWithProviders(<NurseVisitForm />);

      const employeeIdInput = screen.getByLabelText('Employee ID');
      await userEvent.type(employeeIdInput, 'EMP001');

      const submitButton = screen.getByRole('button', { name: /Create Visit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(createVisit).toHaveBeenCalled();
        expect(handleApiError).toHaveBeenCalledWith(new Error('API Error'), 'Failed to create visit');
        expect(show).toHaveBeenCalledWith('Failed to create visit', 'error');
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('disables submit button during submission', async () => {
      const { createVisit } = await import('../../services/ohc');
      vi.mocked(createVisit).mockImplementation(() => {
        return new Promise((resolve) => setTimeout(resolve, 2000));
      });

      renderWithProviders(<NurseVisitForm />);

      const employeeIdInput = screen.getByLabelText('Employee ID');
      await userEvent.type(employeeIdInput, 'EMP001');

      const submitButton = screen.getByRole('button', { name: /Create Visit/i });

      const submitButtonBeforeClick = screen.getByRole('button', { name: /Create Visit/i });
      expect(submitButtonBeforeClick).not.toBeDisabled();

      fireEvent.click(submitButton);

      const submitButtonAfterClick = screen.getByRole('button', { name: /Create Visit/i });
      await waitFor(() => {
        expect(submitButtonAfterClick).toBeDisabled();
      });
    });
  });

  describe('Doctor Options Loading', () => {
    it('shows loading state while fetching doctors', async () => {
      const { fetchDoctorOptions } = await import('../../services/ohc');
      vi.spyOn(fetchDoctorOptions, 'mockImplementation', () => {
        return new Promise(() => {});
      });
      vi.spyOn(fetchDoctorOptions, 'mockImplementation', () => {
        return new Promise((resolve) => setTimeout(resolve, 1000));
      });

      renderWithProviders(<NurseVisitForm />);

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
    });

    it('displays error when doctor fetch fails', async () => {
      const { fetchDoctorOptions, handleApiError } = await import('../../services/ohc');
      vi.spyOn(fetchDoctorOptions, 'mockImplementation', () => {
        return new Promise(() => {
          throw new Error('Network error');
        });
      });
      vi.spyOn(handleApiError, 'mockReturnValue').mockReturnValue('Network error. Please check your connection');

      renderWithProviders(<NurseVisitForm />);

      await waitFor(() => {
        expect(screen.getByText('Network error. Please check your connection')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('redirects to dashboard when cancel button clicked', async () => {
      renderWithProviders(<NurseVisitForm />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('redirects non-nurse users to dashboard', async () => {
      const { useAuth } = await import('../../../contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser({ role: 'EMPLOYEE' }),
        isAuthenticated: true,
      });

      renderWithProviders(<NurseVisitForm />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Input Changes', () => {
    it('updates form state on employee ID input', async () => {
      renderWithProviders(<NurseVisitForm />);

      const employeeIdInput = screen.getByLabelText('Employee ID');
      await userEvent.type(employeeIdInput, '12345');

      await waitFor(() => {
        expect(screen.getByLabelText('Employee ID')).toHaveValue('12345');
      });
    });

    it('updates form state on visit type change', async () => {
      renderWithProviders(<NurseVisitForm />);

      const visitTypeSelect = screen.getByRole('combobox', { name: 'Visit Type' });
      fireEvent.change(visitTypeSelect, 'Periodic');

      await waitFor(() => {
        expect(screen.getByRole('option', { selected: true, name: 'Periodic' })).toBeInTheDocument();
      });
    });

    it('updates form state on triage level change', async () => {
      renderWithProviders(<NurseVisitForm />);

      const triageSelect = screen.getByRole('combobox', { name: 'Triage Level' });
      fireEvent.change(triageSelect, 'Medium');

      await waitFor(() => {
        expect(screen.getByRole('option', { selected: true, name: 'Medium' })).toBeInTheDocument();
      });
    });

    it('updates form state on doctor selection', async () => {
      const { fetchDoctorOptions } = await import('../../services/ohc');

      const mockDoctors = [
        { id: 1, user: { first_name: 'Dr. Sarah', last_name: 'Smith' }, registration_number: 'DOC-001', specializations: 'General Medicine' },
      ];

      vi.spyOn(fetchDoctorOptions, 'mockImplementation', () => {
        return new Promise((resolve) => resolve({ json: mockDoctors }));
      });

      renderWithProviders(<NurseVisitForm />);

      const doctorSelect = screen.getByRole('combobox', { name: 'Select Doctor' });
      fireEvent.change(doctorSelect, mockDoctors[0].id.toString());

      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: 'Select Doctor' }).toHaveValue(mockDoctors[0].id.toString());
      });
    });
  });

  describe('Vitals Interaction', () => {
    it('handles vitals input change for temperature', async () => {
      renderWithProviders(<NurseVisitForm />);

      const tempInput = screen.getByLabelText('Temperature (°F)');
      await userEvent.type(tempInput, '36.5');

      await waitFor(() => {
        expect(screen.getByLabelText('Temperature (°F)')).toHaveValue('36.5');
      });
    });

    it('handles vitals input change for blood pressure', async () => {
      renderWithProviders(<NurseVisitForm />);

      const bpInput = screen.getByLabelText('Blood Pressure');
      await userEvent.type(bpInput, '118/76');

      await waitFor(() => {
        expect(screen.getByLabelText('Blood Pressure')).toHaveValue('118/76');
      });
    });

    it('clears vitals errors when corrected', async () => {
      renderWithProviders(<NurseVisitForm />);

      const tempInput = screen.getByLabelText('Temperature (°F)');
      await userEvent.type(tempInput, '98');

      await waitFor(() => {
        expect(screen.queryByText('Temperature must be between 80-120°F')).not.toBeInTheDocument();
      });
    });

    it('handles vitals blur validation', async () => {
      renderWithProviders(<NurseVisitForm />);

      const tempInput = screen.getByLabelText('Temperature (°F)');
      await userEvent.type(tempInput, '150');
      await userEvent.tab(); // Move away
      await userEvent.tab(); // Move back
      fireEvent.blur(tempInput);

      await waitFor(() => {
        expect(screen.getByText('Temperature must be between 80-120°F')).toBeInTheDocument();
      });
    });
  });

  describe('Visit Date Handling', () => {
    it('renders visit date picker', async () => {
      renderWithProviders(<NurseVisitForm />);

      await waitFor(() => {
        expect(screen.getByLabelText('Visit Date')).toBeInTheDocument();
        const dateInput = screen.getByRole('textbox', { name: 'Visit Date' });
        expect(dateInput).toBeInTheDocument();
      });
    });

    it('accepts date in ISO format', async () => {
      renderWithProviders(<NurseVisitForm />);

      const dateInput = screen.getByRole('textbox', { name: 'Visit Date' });
      await userEvent.type(dateInput, '2026-05-22');

      await waitFor(() => {
        expect(dateInput).toHaveValue('2026-05-22');
      });
    });
  });

  describe('Referral and Follow-up', () => {
    it('toggles referral dropdown', async () => {
      renderWithProviders(<NurseVisitForm />);

      const requiresReferralSelect = screen.getByRole('combobox', { name: 'Requires Referral?' });
      fireEvent.change(requiresReferralSelect, 'true');

      await waitFor(() => {
        expect(screen.getByRole('option', { selected: true, name: 'Yes' })).toBeInTheDocument();
      });
    });

    it('handles follow-up date input', async () => {
      renderWithProviders(<NurseVisitForm />);

      const followUpInput = screen.getByLabelText('Follow-up Date');
      await userEvent.type(followUpInput, '2026-05-30');

      await waitFor(() => {
        expect(screen.getByLabelText('Follow-up Date')).toHaveValue('2026-05-30');
      });
    });

    it('handles next action textarea', async () => {
      renderWithProviders(<NurseVisitForm />);

      const nextActionInput = screen.getByLabelText('Next Action');
      await userEvent.type(nextActionInput, 'Monitor blood pressure');

      await waitFor(() => {
        expect(screen.getByLabelText('Next Action')).toHaveValue('Monitor blood pressure');
      });
    });
  });
});
