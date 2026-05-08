import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock the auth service with all necessary functions
vi.mock('../../services/auth', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  isAuthenticated: vi.fn(() => false),
  getStoredUser: vi.fn(() => null),
  storeUser: vi.fn(),
}));

import { login as mockLogin, logout as mockLogout, getCurrentUser as mockGetCurrentUser } from '../../services/auth';

describe('AuthContext', () => {
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    // Create a wrapper with AuthProvider
    wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useAuth hook', () => {
    it('provides authentication context', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial auth check to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toBeDefined();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('has login function', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.login).toBe('function');
    });

    it('has logout function', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.logout).toBe('function');
    });

    it('has refreshToken function', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.refreshToken).toBe('function');
    });
  });

  describe('login function', () => {
    it('sets authentication state on successful login', async () => {
      const mockLoginResponse = { access: 'token', refresh: 'refresh-token' };
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };

      (mockLogin as ReturnType<typeof vi.fn>).mockResolvedValue(mockLoginResponse);
      (mockGetCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.login({ username: 'testuser', password: 'password' });
      });

      expect(mockLogin).toHaveBeenCalledWith({ username: 'testuser', password: 'password' });
      expect(mockGetCurrentUser).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('handles login error', async () => {
      const mockError = new Error('Invalid credentials');
      (mockLogin as ReturnType<typeof vi.fn>).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login({ username: 'invalid', password: 'wrong' });
        })
      ).rejects.toThrow('Invalid credentials');

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('logout function', () => {
    it('clears authentication state', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        result.current.logout();
      });

      expect(mockLogout).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('refreshToken function', () => {
    it('refreshes user data', async () => {
      const mockUser = { id: 1, username: 'updated-user' };
      (mockGetCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshToken();
      });

      expect(mockGetCurrentUser).toHaveBeenCalled();
      expect(result.current.user).toEqual(mockUser);
    });

    it('logs out on refresh failure', async () => {
      const mockError = new Error('Token expired');
      (mockGetCurrentUser as ReturnType<typeof vi.fn>).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshToken();
      });

      expect(mockLogout).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('initialization', () => {
    it('sets loading to false after initialization', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });
});
