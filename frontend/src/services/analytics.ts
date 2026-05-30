import api, { handleApiError } from './api';
import type { DashboardAnalytics, MedicineSummary, AnalyticsFilters, DateRangeParams, EHSStatistics, FollowUpDetail } from '../types';

export const getDashboard = async (params?: AnalyticsFilters): Promise<DashboardAnalytics> => {
  try {
    const response = await api.get<DashboardAnalytics>('/ohc/analytics/', { params });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};

export const getMedicineSummary = async (params?: DateRangeParams): Promise<MedicineSummary> => {
  try {
    const response = await api.get<MedicineSummary>('/ohc/medicine-summary/', { params });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};

export const getEHSStatistics = async (params?: AnalyticsFilters): Promise<EHSStatistics> => {
  try {
    const response = await api.get<EHSStatistics>('/ohc/analytics/ehs-statistics/', { params });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};

export const exportAnalytics = async (filters: AnalyticsFilters, format: 'csv' | 'excel' = 'csv'): Promise<Blob> => {
  try {
    const response = await api.get('/ohc/analytics/export/', {
      params: { ...filters, format },
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};

export const getFollowUpDetail = async (id: number): Promise<FollowUpDetail> => {
  try {
    const response = await api.get<FollowUpDetail>('/ohc/analytics/follow-up-details/', { params: { id } });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};