import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
  getStoredUser,
  storeUser,
} from '../auth';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

global.localStorage = localStorageMock as unknown as Storage;

// Mock axios - must match api.ts import (import axios from 'axios')
const { mockAxiosPost, mockAxiosGet } = vi.hoisted(() => {
  return {
    mockAxiosPost: vi.fn(),
    mockAxiosGet: vi.fn(),
  };
});

vi.mock('axios', () => {
  const mockAxiosInstance = {
    post: mockAxiosPost,
    get: mockAxiosGet,
    interceptors: {
      request: {
        use: vi.fn(),
      },
      response: {
        use: vi.fn(),
      },
    },
  };
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      isAxiosError: vi.fn(() => true),
    },
    create: vi.fn(() => mockAxiosInstance),
    isAxiosError: vi.fn(() => true),
  };
});

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('login', () => {
    it('calls API with credentials and stores tokens', async () => {
      const mockResponse = {
        data: {
          access: 'access-token-123',
          refresh: 'refresh-token-456',
        },
      };
      mockAxiosPost.mockResolvedValue(mockResponse);

      const result = await login('testuser', 'password123');

      expect(mockAxiosPost).toHaveBeenCalledWith(
        '/auth/token/',
        expect.any(FormData),
        expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } })
      );
      expect(localStorageMock.getItem('access_token')).toBe('access-token-123');
      expect(localStorageMock.getItem('refresh_token')).toBe('refresh-token-456');
      expect(result).toEqual(mockResponse.data);
    });

    it('throws error on invalid credentials', async () => {
      const mockError = new Error('Invalid credentials');
      mockAxiosPost.mockRejectedValue(mockError);

      await expect(login('invalid', 'wrong')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('clears tokens and user from localStorage', () => {
      localStorageMock.setItem('access_token', 'some-token');
      localStorageMock.setItem('refresh_token', 'refresh-token');
      localStorageMock.setItem('user', JSON.stringify({ id: 1, name: 'Test' }));

      logout();

      expect(localStorageMock.getItem('access_token')).toBeNull();
      expect(localStorageMock.getItem('refresh_token')).toBeNull();
      expect(localStorageMock.getItem('user')).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('fetches and returns user data from API', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
      mockAxiosGet.mockResolvedValue({ data: mockUser });

      const result = await getCurrentUser();

      expect(mockAxiosGet).toHaveBeenCalledWith('/accounts/me/');
      expect(result).toEqual(mockUser);
    });

    it('throws error on API failure', async () => {
      const mockError = new Error('Unauthorized');
      mockAxiosGet.mockRejectedValue(mockError);

      await expect(getCurrentUser()).rejects.toThrow('Unauthorized');
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when access token exists', () => {
      localStorageMock.setItem('access_token', 'valid-token');

      expect(isAuthenticated()).toBe(true);
    });

    it('returns false when no access token', () => {
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('getStoredUser', () => {
    it('returns parsed user from localStorage', () => {
      const user = { id: 1, username: 'testuser' };
      localStorageMock.setItem('user', JSON.stringify(user));

      const result = getStoredUser();

      expect(result).toEqual(user);
    });

    it('returns null when no user stored', () => {
      const result = getStoredUser();

      expect(result).toBeNull();
    });

    it('returns null when stored data is invalid JSON', () => {
      localStorageMock.setItem('user', 'invalid-json');

      const result = getStoredUser();

      expect(result).toBeNull();
    });
  });

  describe('storeUser', () => {
    it('stores user as JSON string in localStorage', () => {
      const user = { id: 1, username: 'testuser', email: 'test@example.com' };

      storeUser(user);

      const stored = localStorageMock.getItem('user');
      expect(stored).toBe(JSON.stringify(user));
    });
  });
});
