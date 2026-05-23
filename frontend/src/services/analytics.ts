import api, { handleApiError } from './api';
import type { DashboardAnalytics, MedicineSummary, AnalyticsFilters, DateRangeParams } from '../types';

export const getDashboard = async (params?: AnalyticsFilters): Promise<DashboardAnalytics> => {
  try {
    const response = await api.get<DashboardAnalytics>('/ohc/analytics/dashboard/', { params });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};

export const getMedicineSummary = async (params?: DateRangeParams): Promise<MedicineSummary> => {
  try {
    const response = await api.get<MedicineSummary>('/ohc/analytics/medicine-summary/', { params });
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