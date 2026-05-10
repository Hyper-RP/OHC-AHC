import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockVisit, mockPaginatedResponse } from '../../tests/test-utils';

// Mock the api module
vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
  handleApiError: vi.fn((err: unknown) =>
    err instanceof Error ? err.message : 'API Error'
  ),
}));

import api from '../api';
import {
  listVisits,
  getVisit,
  createVisit,
  createDiagnosis,
  getVisitDiagnoses,
  getVisitPrescriptions,
} from '../ohc';

describe('ohc service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listVisits', () => {
    it('calls GET /ohc/visits/ without params', async () => {
      const mockData = mockPaginatedResponse([mockVisit()]);
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockData });

      const result = await listVisits();
      expect(api.get).toHaveBeenCalledWith('/ohc/visits/', { params: undefined });
      expect(result).toEqual(mockData);
    });

    it('passes filter params correctly', async () => {
      const params = { employee: 'EMP-001', status: 'OPEN', page: 1 };
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockPaginatedResponse([]) });

      await listVisits(params);
      expect(api.get).toHaveBeenCalledWith('/ohc/visits/', { params });
    });

    it('throws on API error', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Network Error'));
      await expect(listVisits()).rejects.toThrow();
    });
  });

  describe('getVisit', () => {
    it('calls GET /ohc/visits/{uuid}/', async () => {
      const visit = mockVisit();
      vi.mocked(api.get).mockResolvedValueOnce({ data: visit });

      const result = await getVisit('visit-uuid-001');
      expect(api.get).toHaveBeenCalledWith('/ohc/visits/visit-uuid-001/');
      expect(result).toEqual(visit);
    });

    it('throws on API error', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Not Found'));
      await expect(getVisit('bad-uuid')).rejects.toThrow();
    });
  });

  describe('createVisit', () => {
    it('calls POST /ohc/visits/ with form data', async () => {
      const formData = {
        employee: 'EMP-001',
        consulted_doctor: 'DOC-001',
        visit_type: 'WALK_IN' as const,
        triage_level: 'LOW' as const,
        visit_date: '2026-05-01',
        chief_complaint: 'Headache',
        symptoms: 'Mild headache',
        vitals: { temperature: '98.6' },
      };
      const visit = mockVisit();
      vi.mocked(api.post).mockResolvedValueOnce({ data: visit });

      const result = await createVisit(formData);
      expect(api.post).toHaveBeenCalledWith('/ohc/visits/', formData);
      expect(result).toEqual(visit);
    });

    it('throws on API error', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Validation Error'));
      await expect(createVisit({} as never)).rejects.toThrow();
    });
  });

  describe('createDiagnosis', () => {
    it('calls POST /ohc/diagnosis-prescriptions/', async () => {
      const diagnosisData = {
        visit: 'visit-uuid-001',
        diagnosed_by: 'DOC-001',
        diagnosis: {
          diagnosis_name: 'Flu',
          severity: 'MILD' as const,
          fitness_decision: 'FIT' as const,
          advised_rest_days: 2,
        },
      };
      const response = { diagnosis: {}, prescriptions: [] };
      vi.mocked(api.post).mockResolvedValueOnce({ data: response });

      const result = await createDiagnosis(diagnosisData);
      expect(api.post).toHaveBeenCalledWith('/ohc/diagnosis-prescriptions/', diagnosisData);
      expect(result).toEqual(response);
    });

    it('throws on API error', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Server Error'));
      await expect(createDiagnosis({} as never)).rejects.toThrow();
    });
  });

  describe('getVisitDiagnoses', () => {
    it('calls GET /ohc/visits/{uuid}/diagnoses/', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: [] });

      const result = await getVisitDiagnoses('visit-uuid-001');
      expect(api.get).toHaveBeenCalledWith('/ohc/visits/visit-uuid-001/diagnoses/');
      expect(result).toEqual([]);
    });
  });

  describe('getVisitPrescriptions', () => {
    it('calls GET /ohc/visits/{uuid}/prescriptions/', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: [] });

      const result = await getVisitPrescriptions('visit-uuid-001');
      expect(api.get).toHaveBeenCalledWith('/ohc/visits/visit-uuid-001/prescriptions/');
      expect(result).toEqual([]);
    });

    it('throws on API error', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Error'));
      await expect(getVisitPrescriptions('bad-uuid')).rejects.toThrow();
    });
  });
});
