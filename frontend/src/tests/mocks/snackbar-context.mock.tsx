/**
 * Shared mock for contexts/SnackbarContext.tsx
 *
 * Usage in test files:
 *   vi.mock('../../contexts/SnackbarContext', () => import('../../tests/mocks/snackbar-context.mock'));
 */
import { vi } from 'vitest';
import type { ReactNode } from 'react';
import React from 'react';

const defaultSnackbarValue = {
  show: vi.fn(),
  close: vi.fn(),
  isOpen: false,
  currentMessage: null,
};

export const useSnackbar = vi.fn(() => ({ ...defaultSnackbarValue }));

export const SnackbarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
