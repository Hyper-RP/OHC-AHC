/**
 * Shared mock for services/api.ts
 *
 * Usage in test files:
 *   vi.mock('../../services/api', () => import('../../tests/mocks/api.mock'));
 */
import { vi } from 'vitest';

// Mock axios instance methods
export const api = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
  defaults: {
    baseURL: '/api',
    headers: { common: {} },
  },
};

export const handleApiError = vi.fn((error: unknown): string => {
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
});

export default api;
