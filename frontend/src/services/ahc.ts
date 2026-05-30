import api, { handleApiError } from './api';
import type {
  Hospital,
  Referral,
  ReferralFormData,
  PaginatedResponse,
} from '../types';

/**
 * List partner hospitals with optional filters
 * @param params - Query parameters for filtering
 * @returns Promise resolving to paginated hospitals
 */
export const listHospitals = async (params?: {
  status?: string;
  speciality?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<Hospital>> => {
  try {
    const response = await api.get<PaginatedResponse<Hospital>>('/ahc/hospitals/', { params });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};

/**
 * Get a single hospital by UUID
 * @param uuid - Hospital UUID
 * @returns Promise resolving to hospital data
 */
export const getHospital = async (uuid: string): Promise<Hospital> => {
  try {
    const response = await api.get<Hospital>(`/ahc/hospitals/${uuid}/`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};

/**
 * List referrals with optional filters
 * @param params - Query parameters for filtering
 * @returns Promise resolving to paginated referrals
 */
export const listReferrals = async (params?: {
  employee?: string;
  status?: string;
  priority?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<Referral>> => {
  try {
    const response = await api.get<PaginatedResponse<Referral>>('/ahc/referrals/', { params });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};

/**
 * Get a single referral by UUID
 * @param uuid - Referral UUID
 * @returns Promise resolving to referral data
 */
export const getReferral = async (uuid: string): Promise<Referral> => {
  try {
    const response = await api.get<Referral>(`/ahc/referrals/${uuid}/`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};

/**
 * Create a new referral
 * @param data - Referral form data
 * @returns Promise resolving to created referral
 */
export const createReferral = async (data: ReferralFormData): Promise<Referral> => {
  try {
    const response = await api.post<Referral>('/ahc/referrals/', data);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};

/**
 * Update referral hospital selection
 * @param uuid - Referral UUID
 * @param hospitalUuid - Selected hospital UUID
 * @returns Promise resolving to updated referral
 */
export const updateReferralHospital = async (
  uuid: string,
  hospitalUuid: string
): Promise<Referral> => {
  try {
    const response = await api.patch<Referral>(`/ahc/referrals/${uuid}/`, {
      hospital: hospitalUuid,
    });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};
