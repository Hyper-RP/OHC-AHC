import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// API base URL from environment variable with fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Attempt to refresh the token
        const response = await axios.post(
          `${API_BASE_URL}/auth/token/refresh/`,
          { refresh: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const newAccessToken = response.data.access;
        localStorage.setItem('access_token', newAccessToken);

        // Update the original request with the new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to handle API errors
export const handleApiError = (error: unknown, defaultMessage = 'An unexpected error occurred'): string => {
  if (axios.isAxiosError(error)) {
    const { response, request, message } = error;

    // Network error (no response received)
    if (!response && request) {
      return 'Network error. Please check your connection and try again.';
    }

    // Server responded with error
    if (response?.data) {
      if (typeof response.data === 'string') {
        const trimmed = response.data.trim();
        if (trimmed.startsWith('<')) {
          if (response.status) {
            const statusMessages: Record<number, string> = {
              400: 'Invalid request. Please check your input.',
              401: 'Your session has expired. Please log in again.',
              403: 'You do not have permission to perform this action.',
              404: 'The requested resource was not found.',
              429: 'Too many requests. Please try again later.',
              500: 'Server error. Please try again later.',
              502: 'Service unavailable. Please try again later.',
              503: 'Service temporarily unavailable. Please try again later.',
            };
            return statusMessages[response.status] || defaultMessage;
          }
          return defaultMessage;
        }

        return trimmed || defaultMessage;
      }

      const data = response.data as Record<string, unknown>;

      // Handle DRF validation errors (non-field errors)
      if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
        return data.non_field_errors[0] as string;
      }

      // Handle detail messages
      if (data.detail) {
        // Handle array of errors (DRF validation)
        if (Array.isArray(data.detail)) {
          return data.detail.join(', ');
        }
        return String(data.detail);
      }

      // Handle field-specific errors
      const errorFields = Object.keys(data).filter(key =>
        key !== 'detail' &&
        key !== 'non_field_errors' &&
        !key.startsWith('_')
      );

      if (errorFields.length > 0) {
        const firstField = errorFields[0];
        const fieldErrors = data[firstField];

        if (Array.isArray(fieldErrors)) {
          return `${formatFieldName(firstField)}: ${fieldErrors[0]}`;
        }
        if (typeof fieldErrors === 'string') {
          return `${formatFieldName(firstField)}: ${fieldErrors}`;
        }
      }
    }

    // HTTP status-specific messages
    if (response?.status) {
      const statusMessages: Record<number, string> = {
        400: 'Invalid request. Please check your input.',
        401: 'Your session has expired. Please log in again.',
        403: 'You do not have permission to perform this action.',
        404: 'The requested resource was not found.',
        429: 'Too many requests. Please try again later.',
        500: 'Server error. Please try again later.',
        502: 'Service unavailable. Please try again later.',
        503: 'Service temporarily unavailable. Please try again later.',
      };
      return statusMessages[response.status] || defaultMessage;
    }

    // Generic axios error message
    if (message) {
      return message;
    }
  }

  // Non-Axios errors
  if (error instanceof Error) {
    return error.message;
  }

  return defaultMessage;
};

// Helper to format field names for error messages
function formatFieldName(field: string): string {
  return field
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default api;
