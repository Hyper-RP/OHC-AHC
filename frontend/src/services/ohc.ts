import api, { handleApiError } from './api';
import type {
  OHCVisit,
  OHCVisitFormData,
  Diagnosis,
  DiagnosisFormData,
  Prescription,
  PaginatedResponse,
} from '../types';

/**
 * List OHC visits with optional filters
 * @param params - Query parameters for filtering
 * @returns Promise resolving to paginated visits
 */
export const listVisits = async (params?: {
  employee?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<OHCVisit>> => {
  try {
    const response = await api.get<PaginatedResponse<OHCVisit>>('/ohc/visits/', { params });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};

/**
 * Get a single OHC visit by UUID
 * @param uuid - Visit UUID
 * @returns Promise resolving to visit data
 */
export const getVisit = async (uuid: string): Promise<OHCVisit> => {
  try {
    const response = await api.get<OHCVisit>(`/ohc/visits/${uuid}/`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};

/**
 * Create a new OHC visit
 * @param data - Visit form data
 * @returns Promise resolving to created visit
 */
export const createVisit = async (data: OHCVisitFormData): Promise<OHCVisit> => {
  try {
    const response = await api.post<OHCVisit>('/ohc/visits/', data);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};

/**
 * Create diagnosis with associated prescriptions
 * @param data - Diagnosis form data with prescriptions
 * @returns Promise resolving to created diagnosis and prescriptions
 */
export const createDiagnosis = async (data: DiagnosisFormData): Promise<{
  diagnosis: Diagnosis;
  prescriptions: Prescription[];
}> => {
  try {
    const response = await api.post('/ohc/diagnosis-prescriptions/', data);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};

/**
 * Get diagnoses for a specific visit
 * @param visitUuid - Visit UUID
 * @returns Promise resolving to array of diagnoses
 */
export const getVisitDiagnoses = async (visitUuid: string): Promise<Diagnosis[]> => {
  try {
    const response = await api.get<Diagnosis[]>(`/ohc/visits/${visitUuid}/diagnoses/`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};

/**
 * Get prescriptions for a specific visit
 * @param visitUuid - Visit UUID
 * @returns Promise resolving to array of prescriptions
 */
export const getVisitPrescriptions = async (visitUuid: string): Promise<Prescription[]> => {
  try {
    const response = await api.get<Prescription[]>(`/ohc/visits/${visitUuid}/prescriptions/`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};
