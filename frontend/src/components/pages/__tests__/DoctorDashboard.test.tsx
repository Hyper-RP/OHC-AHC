import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockUser, mockVisit } from '../../../tests/test-utils';
import { DoctorDashboard } from '../DoctorDashboard';

const mockNavigate = vi.fn();
const mockShow = vi.fn();
const mockRefetch = vi.fn();
const mockCreateDiagnosis = vi.fn();
const mockListHospitals = vi.fn();
const mockUseDashboardData = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser({ role: 'DOCTOR', first_name: 'Sarah', last_name: 'Smith' }),
  }),
}));

vi.mock('../../../contexts/SnackbarContext', () => ({
  useSnackbar: () => ({
    show: mockShow,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../hooks/useDashboardData', () => ({
  useDashboardData: (...args: unknown[]) => mockUseDashboardData(...args),
}));

vi.mock('../../../services/ohc', () => ({
  createDiagnosis: (...args: unknown[]) => mockCreateDiagnosis(...args),
}));

vi.mock('../../../services/ahc', () => ({
  listHospitals: (...args: unknown[]) => mockListHospitals(...args),
}));

describe('DoctorDashboard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-30T10:00:00Z'));
    window.localStorage.clear();
    window.localStorage.setItem(
      'medicine_inventory_records',
      JSON.stringify([
        {
          id: 'MED-001',
          name: 'Paracetamol 650',
          stock: 20,
          reorderLevel: 5,
          unit: 'tablets',
          batch: 'PCM-1',
          expiry: '2026-12-31',
          supplier: 'Test Supplier',
        },
      ]),
    );

    mockNavigate.mockReset();
    mockShow.mockReset();
    mockRefetch.mockReset();
    mockCreateDiagnosis.mockReset();
    mockListHospitals.mockReset();
    mockUseDashboardData.mockReset();

    mockUseDashboardData.mockReturnValue({
      data: {
        results: [mockVisit({ id: 1, visit_status: 'OPEN', visit_date: '2026-05-30' })],
      },
      isLoading: false,
      refetch: mockRefetch,
      lastUpdated: new Date('2026-05-30T10:00:00Z'),
    });
    mockListHospitals.mockResolvedValue({ results: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const openDiagnosisForm = async () => {
    renderWithProviders(<DoctorDashboard />);
    fireEvent.click(await screen.findByText('John Doe'));
    fireEvent.click(await screen.findByRole('button', { name: 'Add Diagnosis' }));
  };

  it('renders examination above diagnosis and restricts follow-up selection to tomorrow onward', async () => {
    await openDiagnosisForm();

    const examinationInput = screen.getByLabelText('Examination');
    const diagnosisInput = screen.getByLabelText('Diagnosis / Observation *');
    const followUpInput = screen.getByLabelText('Follow-up Date (Optional)');

    expect(
      examinationInput.compareDocumentPosition(diagnosisInput) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(followUpInput).toHaveAttribute('min', '2026-05-31');
  });

  it('blocks follow-up dates that are not after today', async () => {
    await openDiagnosisForm();

    fireEvent.change(screen.getByLabelText(/Diagnosis \/ Observation/i), {
      target: { value: 'Viral fever observation' },
    });
    fireEvent.change(screen.getByLabelText(/Medicine Name/i), {
      target: { value: 'Paracetamol 650' },
    });
    fireEvent.change(screen.getByLabelText('Dosage *'), {
      target: { value: '500mg' },
    });
    fireEvent.change(screen.getByLabelText('Frequency *'), {
      target: { value: 'Twice daily' },
    });
    fireEvent.change(screen.getByLabelText('Follow-up Date (Optional)'), {
      target: { value: '2026-05-30' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Submit to Pharmacist' }));

    expect(mockCreateDiagnosis).not.toHaveBeenCalled();
    expect(mockShow).toHaveBeenCalledWith('Please select a follow-up date after today', 'error');
    expect(await screen.findByText('Follow-up date must be after today')).toBeInTheDocument();
  });

  it('prints medicines immediately after vitals in the prescription pdf layout', async () => {
    const documentWrite = vi.fn();
    const documentClose = vi.fn();
    const documentOpen = vi.fn();

    vi.spyOn(window, 'open').mockReturnValue({
      document: {
        open: documentOpen,
        write: documentWrite,
        close: documentClose,
      },
    } as unknown as Window);

    await openDiagnosisForm();

    fireEvent.change(screen.getByLabelText(/Diagnosis \/ Observation/i), {
      target: { value: 'Migraine' },
    });
    fireEvent.change(screen.getByLabelText(/Medicine Name/i), {
      target: { value: 'Paracetamol 650' },
    });
    fireEvent.change(screen.getByLabelText('Dosage *'), {
      target: { value: '500mg' },
    });
    fireEvent.change(screen.getByLabelText('Frequency *'), {
      target: { value: 'Twice daily' },
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Print' })[0]);

    await waitFor(() => {
      expect(documentWrite).toHaveBeenCalled();
    });

    const printedHtml = documentWrite.mock.calls[0][0] as string;
    const vitalsIndex = printedHtml.indexOf('>Vitals<');
    const medicinesIndex = printedHtml.indexOf('>Medicines<');
    const referralIndex = printedHtml.indexOf('>Referral<');

    expect(vitalsIndex).toBeGreaterThan(-1);
    expect(medicinesIndex).toBeGreaterThan(vitalsIndex);
    expect(referralIndex).toBeGreaterThan(medicinesIndex);
  });
});
