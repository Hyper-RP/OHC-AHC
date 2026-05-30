/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { SnackbarMessage } from '../types';

interface SnackbarContextType {
  show: (message: string, severity?: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;
  close: () => void;
  isOpen: boolean;
  currentMessage: SnackbarMessage | null;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

interface SnackbarProviderProps {
  children: ReactNode;
}

/**
 * Snackbar Context Provider
 * Manages toast notifications throughout the application
 */
export const SnackbarProvider: React.FC<SnackbarProviderProps> = ({ children }) => {
  const [currentMessage, setCurrentMessage] = useState<SnackbarMessage | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = React.useRef<number | null>(null);

  /**
   * Close the current snackbar
   */
  const close = useCallback(() => {
    setIsOpen(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Wait for animation to complete before clearing message
    setTimeout(() => {
      setCurrentMessage(null);
    }, 300);
  }, [setIsOpen, setCurrentMessage]);

  /**
   * Show a snackbar message
   * Auto-dismisses after specified duration (default: 4000ms)
   */
  const show = useCallback((
    message: string,
    severity: 'success' | 'error' | 'info' | 'warning' = 'info',
    duration: number = 4000
  ): void => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const newMessage: SnackbarMessage = {
      id: Date.now().toString(),
      message,
      severity,
      duration,
    };

    setCurrentMessage(newMessage);
    setIsOpen(true);

    // Auto-dismiss after duration
    timeoutRef.current = setTimeout(() => {
      close();
    }, duration);
  }, [close]);

  const value: SnackbarContextType = {
    show,
    close,
    isOpen,
    currentMessage,
  };

  return <SnackbarContext.Provider value={value}>{children}</SnackbarContext.Provider>;
};

/**
 * Custom hook to use snackbar context
 * @throws Error if used outside SnackbarProvider
 */
export const useSnackbar = (): SnackbarContextType => {
  const context = useContext(SnackbarContext);
  if (context === undefined) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};
