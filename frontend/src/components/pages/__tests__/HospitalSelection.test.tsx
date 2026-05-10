import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../tests/test-utils';
import { HospitalSelection } from '../HospitalSelection';

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { first_name: 'Admin', role: 'ADMIN' },
    isAuthenticated: true, loading: false,
    login: vi.fn(), logout: vi.fn(), refreshToken: vi.fn(),
  })),
}));

const mockHospitals = [
  {
    uuid: 'hosp-1', name: 'City General Hospital', code: 'CGH-001',
    hospital_status: 'ACTIVE', hospital_type: 'Multi-Specialty',
    contact_person: 'Dr. Kumar', phone_number: '9876543210',
    email: 'info@cgh.com', address_line_1: '123 Lane', city: 'Mumbai',
    state: 'Maharashtra', specialties: ['Cardiology', 'Orthopedics'],
    supports_cashless: true, is_available_for_video: false,
  },
  {
    uuid: 'hosp-2', name: 'Delhi Medical Center', code: 'DMC-002',
    hospital_status: 'ACTIVE', hospital_type: 'General',
    contact_person: 'Dr. Sharma', phone_number: '9876543211',
    email: 'info@dmc.com', address_line_1: '456 Road', city: 'Delhi',
    state: 'Delhi', specialties: ['General Medicine', 'ENT', 'Dermatology', 'Neurology'],
    supports_cashless: false, is_available_for_video: true,
  },
];

vi.mock('../../../services/ahc', () => ({
  listHospitals: vi.fn(),
}));

import { listHospitals } from '../../../services/ahc';

describe('HospitalSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listHospitals).mockResolvedValue({ count: 2, next: null, previous: null, results: mockHospitals });
  });

  it('shows loading state initially', () => {
    renderWithProviders(<HospitalSelection />);
    expect(screen.getByText('Loading hospitals...')).toBeInTheDocument();
  });

  it('renders hospital cards after loading', async () => {
    renderWithProviders(<HospitalSelection />);
    await waitFor(() => {
      expect(screen.getByText('City General Hospital')).toBeInTheDocument();
      expect(screen.getByText('Delhi Medical Center')).toBeInTheDocument();
    });
  });

  it('renders header with title', async () => {
    renderWithProviders(<HospitalSelection />);
    await waitFor(() => {
      expect(screen.getByText('Partner Hospitals')).toBeInTheDocument();
    });
  });

  it('renders search input', async () => {
    renderWithProviders(<HospitalSelection />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search hospitals by name or city...')).toBeInTheDocument();
    });
  });

  it('filters hospitals by name', async () => {
    renderWithProviders(<HospitalSelection />);
    await waitFor(() => {
      expect(screen.getByText('City General Hospital')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search hospitals by name or city...');
    fireEvent.change(searchInput, { target: { value: 'Delhi' } });

    expect(screen.queryByText('City General Hospital')).not.toBeInTheDocument();
    expect(screen.getByText('Delhi Medical Center')).toBeInTheDocument();
  });

  it('shows empty state when no hospitals match filter', async () => {
    renderWithProviders(<HospitalSelection />);
    await waitFor(() => {
      expect(screen.getByText('City General Hospital')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search hospitals by name or city...');
    fireEvent.change(searchInput, { target: { value: 'Nonexistent' } });

    expect(screen.getByText('No hospitals found matching your search.')).toBeInTheDocument();
  });

  it('displays cashless feature tag', async () => {
    renderWithProviders(<HospitalSelection />);
    await waitFor(() => {
      expect(screen.getByText('Cashless')).toBeInTheDocument();
    });
  });

  it('displays video consult feature tag', async () => {
    renderWithProviders(<HospitalSelection />);
    await waitFor(() => {
      expect(screen.getByText('Video Consult')).toBeInTheDocument();
    });
  });

  it('shows error on API failure', async () => {
    vi.mocked(listHospitals).mockRejectedValue(new Error('Network error'));
    renderWithProviders(<HospitalSelection />);
    await waitFor(() => {
      expect(screen.getByText('Failed to load hospitals')).toBeInTheDocument();
    });
  });

  it('shows +N tag when hospital has more than 3 specialties', async () => {
    renderWithProviders(<HospitalSelection />);
    await waitFor(() => {
      expect(screen.getByText('+1')).toBeInTheDocument();
    });
  });
});
