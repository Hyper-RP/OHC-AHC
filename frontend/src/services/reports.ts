import api, { handleApiError } from './api';
import type {
  EmployeeHealthHistory,
  DiseaseTrends,
  DepartmentStats,
} from '../types';

/**
 * Get complete health history for an employee
 * @param employeeId - Employee profile ID
 * @param dateFrom - Optional start date filter
 * @param dateTo - Optional end date filter
 * @returns Promise resolving to employee health history
 */
export const getEmployeeHealthHistory = async (
  employeeId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<EmployeeHealthHistory> => {
  try {
    const params: Record<string, string> = { employee_code: employeeId };
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;

    const response = await api.get<EmployeeHealthHistory>(
      '/reports/employee-health-history/',
      { params }
    );
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};

/**
 * Get disease trends and analytics
 * @param period - Days to analyze (30, 90, 180, 365)
 * @param severity - Optional severity filter
 * @returns Promise resolving to disease trends data
 */
export const getDiseaseTrends = async (
  period: number,
  severity?: string
): Promise<DiseaseTrends> => {
  try {
    const params: Record<string, string | number> = { period };
    if (severity) params.severity = severity;

    const response = await api.get<DiseaseTrends>('/reports/disease-trends/', { params });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};

/**
 * Get health statistics by department
 * @param period - Days to analyze (30, 90, 180, 365)
 * @param department - Optional department filter
 * @returns Promise resolving to department stats data
 */
export const getDepartmentHealthStats = async (
  period: number,
  department?: string
): Promise<DepartmentStats> => {
  try {
    const params: Record<string, string | number> = { period };
    if (department) params.department = department;

    const response = await api.get<DepartmentStats>('/reports/department-health-stats/', {
      params,
    });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};

/**
 * Export employee health history to CSV
 * @param employeeId - Employee profile ID
 * @param dateFrom - Optional start date filter
 * @param dateTo - Optional end date filter
 * @returns Promise resolving to CSV blob
 */
export const exportEmployeeHealthHistory = async (
  employeeId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<Blob> => {
  try {
    const params: Record<string, string> = { employee_code: employeeId };
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;

    const response = await api.get('/exports/employee-health-history.csv', {
      params,
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};

/**
 * Export department health stats to CSV
 * @param period - Days to analyze
 * @param department - Optional department filter
 * @returns Promise resolving to CSV blob
 */
export const exportDepartmentHealthStats = async (
  period: number,
  department?: string
): Promise<Blob> => {
  try {
    const params: Record<string, string | number> = { period };
    if (department) params.department = department;

    const response = await api.get('/exports/department-health-stats.csv', {
      params,
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};

/**
 * Export analytics summary to PDF
 * @param period - Days to analyze
 * @param reportType - Report type (summary, detailed, trends)
 * @returns Promise resolving to PDF blob
 */
export const exportAnalyticsSummary = async (
  period: number,
  reportType: 'summary' | 'detailed' | 'trends' = 'summary'
): Promise<Blob> => {
  try {
    const response = await api.get('/exports/analytics-summary.pdf', {
      params: { period, report_type: reportType },
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};

/**
 * Get dashboard UI statistics from Django API
 * @returns Promise resolving to dashboard metrics data
 */
export const getDashboardStats = async (): Promise<Record<string, unknown>> => {
  try {
    const response = await api.get("/reports/dashboard-home/");
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};

