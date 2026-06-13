import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getEHSStatistics } from '../analytics';
import api from '../api';
import type { EHSStatistics } from '../../types';

vi.mock('../api', async () => {
  const actual = await vi.importActual<any>('../api');
  return {
    ...actual,
    default: {
      get: vi.fn(),
    },
  };
});

describe('getEHSStatistics', () => {
  const mockEHSStatistics: EHSStatistics = {
    opd: {
      today_count: 5,
      till_date_count: 123,
      visits: [
        {
          id: '1',
          employee_code: 'EMP-001',
          employee_name: 'John Doe',
          department: 'Engineering',
          visit_time: '2026-05-24T09:30:00Z',
          chief_complaint: 'Headache',
          status: 'IN_PROGRESS',
        },
      ],
    },
    preEmployment: {
      total_checks: 48,
      fit_count: 45,
      unfit_count: 3,
      fit_rate: 93.75,
      today_count: 2,
    },
    ahc: {
      today_count: 2,
      till_date_count: 156,
      total_employees: 233,
      completion_percentage: 66.95,
    },
    incident: {
      today_count: 0,
      till_date_count: 12,
      severity: { LOW: 7, MEDIUM: 3, HIGH: 2, CRITICAL: 0 },
      attention_required: false,
    },
    emergency: {
      today_count: 1,
      till_date_count: 8,
      severity: { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 2 },
      critical_alert: true,
    },
    referred: {
      today_count: 0,
      till_date_count: 23,
      hospitals: [
        { hospital_name: 'City Hospital', referral_count: 12 },
        { hospital_name: 'MediCare Clinic', referral_count: 8 },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Success Cases', () => {
    it('should fetch EHS statistics successfully', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: mockEHSStatistics,
      } as any);

      const result = await getEHSStatistics();

      expect(api.get).toHaveBeenCalledWith('/ohc/analytics/ehs-statistics/', {
        params: undefined,
      });
      expect(result).toEqual(mockEHSStatistics);
    });

    it('should pass query parameters to the API', async () => {
      const filters = {
        date_from: '2026-05-01',
        date_to: '2026-05-31',
        department: 'Engineering',
      };

      vi.mocked(api.get).mockResolvedValue({
        data: mockEHSStatistics,
      } as any);

      await getEHSStatistics(filters);

      expect(api.get).toHaveBeenCalledWith('/ohc/analytics/ehs-statistics/', {
        params: filters,
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw an error when API request fails', async () => {
      const mockError = new Error('Network error');
      vi.mocked(api.get).mockRejectedValue(mockError);

      await expect(getEHSStatistics()).rejects.toThrow('Network error');
    });

    it('should throw an error with error message when response contains error', async () => {
      vi.mocked(api.get).mockRejectedValue({
        response: { data: { detail: 'Authentication failed' } },
      });

      await expect(getEHSStatistics()).rejects.toThrow();
    });
  });

  describe('Data Validation', () => {
    it('should return valid OPD statistics', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: mockEHSStatistics,
      } as any);

      const result = await getEHSStatistics();

      expect(result.opd.today_count).toBeGreaterThanOrEqual(0);
      expect(result.opd.visits).toBeInstanceOf(Array);
      expect(result.opd.visits[0]).toHaveProperty('employee_name');
      expect(result.opd.visits[0]).toHaveProperty('department');
      expect(result.opd.visits[0]).toHaveProperty('visit_time');
    });

    it('should return valid pre-employment statistics', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: mockEHSStatistics,
      } as any);

      const result = await getEHSStatistics();

      expect(result.preEmployment.fit_count + result.preEmployment.unfit_count).toBeLessThanOrEqual(
        result.preEmployment.total_checks
      );
      expect(result.preEmployment.fit_rate).toBeGreaterThanOrEqual(0);
      expect(result.preEmployment.fit_rate).toBeLessThanOrEqual(100);
    });

    it('should return valid AHC statistics', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: mockEHSStatistics,
      } as any);

      const result = await getEHSStatistics();

      expect(result.ahc.till_date_count).toBeLessThanOrEqual(result.ahc.total_employees);
      expect(result.ahc.completion_percentage).toBeGreaterThanOrEqual(0);
      expect(result.ahc.completion_percentage).toBeLessThanOrEqual(100);
    });

    it('should return valid incident statistics with severity breakdown', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: mockEHSStatistics,
      } as any);

      const result = await getEHSStatistics();

      expect(result.incident.severity).toHaveProperty('LOW');
      expect(result.incident.severity).toHaveProperty('MEDIUM');
      expect(result.incident.severity).toHaveProperty('HIGH');
      expect(result.incident.severity).toHaveProperty('CRITICAL');
      expect(
        Object.values(result.incident.severity).reduce((sum, count) => sum + count, 0)
      ).toBe(result.incident.till_date_count);
    });

    it('should return valid emergency statistics', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: mockEHSStatistics,
      } as any);

      const result = await getEHSStatistics();

      expect(result.emergency.critical_alert).toBe(result.emergency.today_count > 0);
      expect(
        Object.values(result.emergency.severity).reduce((sum, count) => sum + count, 0)
      ).toBe(result.emergency.till_date_count);
    });

    it('should return valid referred statistics', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: mockEHSStatistics,
      } as any);

      const result = await getEHSStatistics();

      expect(result.referred.hospitals).toBeInstanceOf(Array);
      if (result.referred.hospitals.length > 0) {
        expect(result.referred.hospitals[0]).toHaveProperty('hospital_name');
        expect(result.referred.hospitals[0]).toHaveProperty('referral_count');
      }
    });
  });
});