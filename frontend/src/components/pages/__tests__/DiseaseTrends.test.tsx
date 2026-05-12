import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockDiseaseTrends } from '../../../tests/test-utils';
import { DiseaseTrends } from '../DiseaseTrends';

vi.mock('../../../services/reports', () => ({
  getDiseaseTrends: vi.fn(),
  exportAnalyticsSummary: vi.fn(),
}));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, first_name: 'Admin', role: 'ADMIN' },
    isAuthenticated: true, loading: false,
    login: vi.fn(), logout: vi.fn(), refreshToken: vi.fn(),
  })),
}));

import { getDiseaseTrends } from '../../../services/reports';

describe('DiseaseTrends', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches trends on mount with default period 90', async () => {
    vi.mocked(getDiseaseTrends).mockResolvedValueOnce(mockDiseaseTrends());
    renderWithProviders(<DiseaseTrends />, { routerProps: { initialEntries: ['/reports/disease-trends'] } });

    await waitFor(() => {
      expect(getDiseaseTrends).toHaveBeenCalledWith(90);
    });
  });

  it('renders diagnosis area chart after loading', async () => {
    vi.mocked(getDiseaseTrends).mockResolvedValueOnce(mockDiseaseTrends());
    renderWithProviders(<DiseaseTrends />, { routerProps: { initialEntries: ['/reports/disease-trends'] } });

    await waitFor(() => {
      expect(screen.getByText('Diagnosis Volume Over Time')).toBeInTheDocument();
    });
  });

  it('renders severity trends chart after loading', async () => {
    vi.mocked(getDiseaseTrends).mockResolvedValueOnce(mockDiseaseTrends());
    renderWithProviders(<DiseaseTrends />, { routerProps: { initialEntries: ['/reports/disease-trends'] } });

    await waitFor(() => {
      expect(screen.getByText('Severity Distribution Trends')).toBeInTheDocument();
    });
  });

  it('renders Export PDF button', async () => {
    vi.mocked(getDiseaseTrends).mockResolvedValueOnce(mockDiseaseTrends());
    renderWithProviders(<DiseaseTrends />, { routerProps: { initialEntries: ['/reports/disease-trends'] } });

    await waitFor(() => {
      expect(screen.getByText('Export PDF')).toBeInTheDocument();
    });
  });

  it('shows error banner when API fails', async () => {
    vi.mocked(getDiseaseTrends).mockRejectedValue(new Error('Failed to load trends'));
    renderWithProviders(<DiseaseTrends />, { routerProps: { initialEntries: ['/reports/disease-trends'] } });

    await waitFor(() => {
      expect(screen.getByText('Failed to load disease trends')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });
});
