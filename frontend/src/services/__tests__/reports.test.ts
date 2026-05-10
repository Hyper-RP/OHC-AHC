import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDepartmentStats, mockDiseaseTrends, mockBlob } from '../../tests/test-utils';

vi.mock('../api', () => ({
  default: { get: vi.fn() },
  handleApiError: vi.fn((e: unknown) => e instanceof Error ? e.message : 'API Error'),
}));

import api from '../api';
import {
  getEmployeeHealthHistory, getDiseaseTrends, getDepartmentHealthStats,
  exportEmployeeHealthHistory, exportDepartmentHealthStats, exportAnalyticsSummary,
  getDashboardStats,
} from '../reports';

describe('reports service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getEmployeeHealthHistory calls with employee param', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: {} });
    await getEmployeeHealthHistory('EMP-001');
    expect(api.get).toHaveBeenCalledWith('/reports/employee-health-history/', { params: { employee: 'EMP-001' } });
  });

  it('getEmployeeHealthHistory passes date range params', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: {} });
    await getEmployeeHealthHistory('EMP-001', '2026-01-01', '2026-05-01');
    expect(api.get).toHaveBeenCalledWith('/reports/employee-health-history/', {
      params: { employee: 'EMP-001', date_from: '2026-01-01', date_to: '2026-05-01' },
    });
  });

  it('getDiseaseTrends calls with period param', async () => {
    const trends = mockDiseaseTrends();
    vi.mocked(api.get).mockResolvedValueOnce({ data: trends });
    const result = await getDiseaseTrends(90);
    expect(api.get).toHaveBeenCalledWith('/reports/disease-trends/', { params: { period: 90 } });
    expect(result).toEqual(trends);
  });

  it('getDiseaseTrends passes severity filter', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockDiseaseTrends() });
    await getDiseaseTrends(30, 'MILD');
    expect(api.get).toHaveBeenCalledWith('/reports/disease-trends/', { params: { period: 30, severity: 'MILD' } });
  });

  it('getDepartmentHealthStats calls with period param', async () => {
    const stats = mockDepartmentStats();
    vi.mocked(api.get).mockResolvedValueOnce({ data: stats });
    const result = await getDepartmentHealthStats(90);
    expect(api.get).toHaveBeenCalledWith('/reports/department-health-stats/', { params: { period: 90 } });
    expect(result).toEqual(stats);
  });

  it('getDepartmentHealthStats passes department filter', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockDepartmentStats() });
    await getDepartmentHealthStats(90, 'Engineering');
    expect(api.get).toHaveBeenCalledWith('/reports/department-health-stats/', {
      params: { period: 90, department: 'Engineering' },
    });
  });

  it('exportEmployeeHealthHistory returns blob', async () => {
    const blob = mockBlob();
    vi.mocked(api.get).mockResolvedValueOnce({ data: blob });
    const result = await exportEmployeeHealthHistory('EMP-001');
    expect(api.get).toHaveBeenCalledWith('/exports/employee-health-history.csv', expect.objectContaining({ responseType: 'blob' }));
    expect(result).toBe(blob);
  });

  it('exportDepartmentHealthStats returns blob', async () => {
    const blob = mockBlob();
    vi.mocked(api.get).mockResolvedValueOnce({ data: blob });
    const result = await exportDepartmentHealthStats(90);
    expect(api.get).toHaveBeenCalledWith('/exports/department-health-stats.csv', expect.objectContaining({ responseType: 'blob' }));
    expect(result).toBe(blob);
  });

  it('exportAnalyticsSummary defaults reportType to summary', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockBlob('pdf', 'application/pdf') });
    await exportAnalyticsSummary(90);
    expect(api.get).toHaveBeenCalledWith('/exports/analytics-summary.pdf', {
      params: { period: 90, report_type: 'summary' },
      responseType: 'blob',
    });
  });

  it('exportAnalyticsSummary passes custom report type', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockBlob() });
    await exportAnalyticsSummary(30, 'detailed');
    expect(api.get).toHaveBeenCalledWith('/exports/analytics-summary.pdf', {
      params: { period: 30, report_type: 'detailed' },
      responseType: 'blob',
    });
  });

  it('getDashboardStats calls /reports/dashboard-home/', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { visits: 100 } });
    const result = await getDashboardStats();
    expect(api.get).toHaveBeenCalledWith('/reports/dashboard-home/');
    expect(result).toEqual({ visits: 100 });
  });

  it('report functions throw on API error', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Server Error'));
    await expect(getDiseaseTrends(90)).rejects.toThrow();
    await expect(getDepartmentHealthStats(90)).rejects.toThrow();
    await expect(getDashboardStats()).rejects.toThrow();
  });
});
