import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockHospital, mockReferral, mockPaginatedResponse } from '../../tests/test-utils';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
  handleApiError: vi.fn((err: unknown) =>
    err instanceof Error ? err.message : 'API Error'
  ),
}));

import api from '../api';
import {
  listHospitals,
  getHospital,
  listReferrals,
  getReferral,
  createReferral,
  updateReferralHospital,
} from '../ahc';

describe('ahc service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listHospitals', () => {
    it('calls GET /ahc/hospitals/', async () => {
      const data = mockPaginatedResponse([mockHospital()]);
      vi.mocked(api.get).mockResolvedValueOnce({ data });

      const result = await listHospitals();
      expect(api.get).toHaveBeenCalledWith('/ahc/hospitals/', { params: undefined });
      expect(result).toEqual(data);
    });

    it('passes filter params', async () => {
      const params = { status: 'ACTIVE', speciality: 'Cardiology' };
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockPaginatedResponse([]) });

      await listHospitals(params);
      expect(api.get).toHaveBeenCalledWith('/ahc/hospitals/', { params });
    });

    it('throws on error', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Network Error'));
      await expect(listHospitals()).rejects.toThrow();
    });
  });

  describe('getHospital', () => {
    it('calls GET /ahc/hospitals/{uuid}/', async () => {
      const hospital = mockHospital();
      vi.mocked(api.get).mockResolvedValueOnce({ data: hospital });

      const result = await getHospital('hosp-uuid-001');
      expect(api.get).toHaveBeenCalledWith('/ahc/hospitals/hosp-uuid-001/');
      expect(result).toEqual(hospital);
    });
  });

  describe('listReferrals', () => {
    it('calls GET /ahc/referrals/', async () => {
      const data = mockPaginatedResponse([mockReferral()]);
      vi.mocked(api.get).mockResolvedValueOnce({ data });

      const result = await listReferrals();
      expect(api.get).toHaveBeenCalledWith('/ahc/referrals/', { params: undefined });
      expect(result).toEqual(data);
    });

    it('passes filter params', async () => {
      const params = { status: 'SENT', priority: 'URGENT' };
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockPaginatedResponse([]) });

      await listReferrals(params);
      expect(api.get).toHaveBeenCalledWith('/ahc/referrals/', { params });
    });
  });

  describe('getReferral', () => {
    it('calls GET /ahc/referrals/{uuid}/', async () => {
      const referral = mockReferral();
      vi.mocked(api.get).mockResolvedValueOnce({ data: referral });

      const result = await getReferral('ref-uuid-001');
      expect(api.get).toHaveBeenCalledWith('/ahc/referrals/ref-uuid-001/');
      expect(result).toEqual(referral);
    });
  });

  describe('createReferral', () => {
    it('calls POST /ahc/referrals/ with form data', async () => {
      const formData = {
        visit: 'visit-uuid-001',
        employee: 'EMP-001',
        referred_by: 'DOC-001',
        referral_reason: 'Needs specialist',
        priority: 'NORMAL' as const,
      };
      const referral = mockReferral();
      vi.mocked(api.post).mockResolvedValueOnce({ data: referral });

      const result = await createReferral(formData);
      expect(api.post).toHaveBeenCalledWith('/ahc/referrals/', formData);
      expect(result).toEqual(referral);
    });

    it('throws on error', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Validation'));
      await expect(createReferral({} as never)).rejects.toThrow();
    });
  });

  describe('updateReferralHospital', () => {
    it('calls PATCH /ahc/referrals/{uuid}/ with hospital uuid', async () => {
      const referral = mockReferral();
      vi.mocked(api.patch).mockResolvedValueOnce({ data: referral });

      const result = await updateReferralHospital('ref-uuid-001', 'hosp-uuid-001');
      expect(api.patch).toHaveBeenCalledWith('/ahc/referrals/ref-uuid-001/', {
        hospital: 'hosp-uuid-001',
      });
      expect(result).toEqual(referral);
    });

    it('throws on error', async () => {
      vi.mocked(api.patch).mockRejectedValueOnce(new Error('Forbidden'));
      await expect(updateReferralHospital('x', 'y')).rejects.toThrow();
    });
  });
});
