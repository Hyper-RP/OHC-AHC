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

  it('renders total diagnoses after loading', async () => {
    vi.mocked(getDiseaseTrends).mockResolvedValueOnce(mockDiseaseTrends());
    renderWithProviders(<DiseaseTrends />, { routerProps: { initialEntries: ['/reports/disease-trends'] } });

    await waitFor(() => {
      expect(screen.getByText('Total Diagnoses')).toBeInTheDocument();
      expect(screen.getByText('450')).toBeInTheDocument();
    });
  });

  it('renders trend diagnosis names', async () => {
    vi.mocked(getDiseaseTrends).mockResolvedValueOnce(mockDiseaseTrends());
    renderWithProviders(<DiseaseTrends />, { routerProps: { initialEntries: ['/reports/disease-trends'] } });

    await waitFor(() => {
      expect(screen.getByText('Diagnosis Trends')).toBeInTheDocument();
      // Upper Respiratory Infection appears in Most Common card + trends list
      const uriElements = screen.getAllByText('Upper Respiratory Infection');
      expect(uriElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Back Pain')).toBeInTheDocument();
    });
  });

  it('renders severity breakdown section', async () => {
    vi.mocked(getDiseaseTrends).mockResolvedValueOnce(mockDiseaseTrends());
    renderWithProviders(<DiseaseTrends />, { routerProps: { initialEntries: ['/reports/disease-trends'] } });

    await waitFor(() => {
      expect(screen.getByText('Severity Breakdown')).toBeInTheDocument();
      // Check that the breakdown count values appear
      expect(screen.getByText('200')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('80')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
    });
  });

  it('renders Export PDF button', async () => {
    vi.mocked(getDiseaseTrends).mockResolvedValueOnce(mockDiseaseTrends());
    renderWithProviders(<DiseaseTrends />, { routerProps: { initialEntries: ['/reports/disease-trends'] } });

    await waitFor(() => {
      expect(screen.getByText('Export PDF')).toBeInTheDocument();
    });
  });
});
