/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { login as loginUser, logout as logoutUser, getCurrentUser, isAuthenticated, getStoredUser, storeUser } from '../services/auth';
import type { User, LoginCredentials } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Context Provider
 * Manages user authentication state and provides auth methods
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Initialize authentication state on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      const isAuth = isAuthenticated();

      if (isAuth) {
        // Try to get stored user first
        const storedUser = getStoredUser();
        if (storedUser) {
          setUser(storedUser);
          setLoading(false);
          return;
        }

        // If no stored user, fetch from API
        try {
          const userData = await getCurrentUser();
          setUser(userData);
          storeUser(userData);
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          // Clear invalid tokens
          logoutUser();
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Login user with credentials
   */
  const login = async (credentials: LoginCredentials): Promise<void> => {
    await loginUser(credentials);
    const userData = await getCurrentUser();
    setUser(userData);
    storeUser(userData);
  };

  /**
   * Logout current user
   */
  const logout = (): void => {
    logoutUser();
    setUser(null);
  };

  /**
   * Refresh authentication token
   */
  const refreshToken = async (): Promise<void> => {
    try {
      const newToken = await getCurrentUser();
      setUser(newToken);
      storeUser(newToken);
    } catch {
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use authentication context
 * @throws Error if used outside AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
