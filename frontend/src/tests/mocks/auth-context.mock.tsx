/**
 * Shared mock for contexts/AuthContext.tsx
 *
 * Usage in test files:
 *   vi.mock('../../contexts/AuthContext', () => import('../../tests/mocks/auth-context.mock'));
 *
 * To customize per test:
 *   const { useAuth } = await import('../../contexts/AuthContext');
 *   vi.mocked(useAuth).mockReturnValue({ ...customValue });
 */
import { vi } from 'vitest';
import type { ReactNode } from 'react';
import React from 'react';
import { mockUser } from '../test-utils';

const defaultAuthValue = {
  user: mockUser(),
  isAuthenticated: true,
  loading: false,
  login: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn(),
  refreshToken: vi.fn().mockResolvedValue(undefined),
};

// Current mock state — tests can mutate this via useAuth mock
let currentValue = { ...defaultAuthValue };

export const useAuth = vi.fn(() => currentValue);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

/**
 * Reset the auth mock to defaults.
 * Call in beforeEach to get clean state.
 */
export const __resetAuthMock = () => {
  currentValue = {
    ...defaultAuthValue,
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    refreshToken: vi.fn().mockResolvedValue(undefined),
  };
  useAuth.mockReturnValue(currentValue);
};

/**
 * Set custom auth mock values for a specific test.
 */
export const __setAuthMock = (overrides: Partial<typeof defaultAuthValue>) => {
  currentValue = { ...currentValue, ...overrides };
  useAuth.mockReturnValue(currentValue);
};
