import api, { handleApiError } from './api';
import type {
  LoginCredentials,
  AuthResponse,
  User,
} from '../types';

/**
 * Authenticate user with username/password
 * @param credentials - User login credentials
 * @returns Promise resolving to auth response with tokens
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await api.post<AuthResponse>('/auth/token/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Store tokens in localStorage
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);

    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};

/**
 * Refresh the access token using refresh token
 * @returns Promise resolving to new access token or null if failed
 */
export const refreshToken = async (): Promise<string | null> => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return null;
    }

    const response = await api.post<{ access: string }>('/auth/token/refresh/', {
      refresh: refreshToken,
    });

    // Store new access token
    localStorage.setItem('access_token', response.data.access);
    return response.data.access;
  } catch {
    // Clear tokens on refresh failure
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    return null;
  }
};

/**
 * Get current authenticated user information
 * @returns Promise resolving to user data
 */
export const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await api.get<User>('/accounts/me/');
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};

/**
 * Logout user by clearing tokens and user data
 */
export const logout = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

/**
 * Check if user is authenticated (has valid access token)
 * @returns Boolean indicating authentication status
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('access_token');
  return !!token;
};

/**
 * Get stored user data
 * @returns User object or null if not authenticated
 */
export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Store user data in localStorage
 * @param user - User object to store
 */
export const storeUser = (user: User): void => {
  localStorage.setItem('user', JSON.stringify(user));
};
