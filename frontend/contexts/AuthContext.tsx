'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { User, LoginCredentials } from '@/lib/types';
import { CacheManager } from '@/lib/cache';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in (check both storage types)
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
      : null;
    const savedUser = typeof window !== 'undefined' 
      ? localStorage.getItem('user') || sessionStorage.getItem('user')
      : null;

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await apiClient.login(credentials);

      if (response.success && response.token && response.user) {
        const rememberMe = credentials.rememberMe ?? false;
        
        apiClient.setToken(response.token, rememberMe);
        setUser(response.user);
        
        // Save user to appropriate storage based on rememberMe preference
        if (typeof window !== 'undefined') {
          const storage = rememberMe ? localStorage : sessionStorage;
          storage.setItem('user', JSON.stringify(response.user));
          storage.setItem('rememberMe', String(rememberMe));
        }

        return { success: true };
      }

      return {
        success: false,
        error: response.error || 'Login failed',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'An error occurred during login',
      };
    }
  };

  const logout = () => {
    apiClient.removeToken();
    setUser(null);
    CacheManager.clearCache();
    
    // Clear from both storage types
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('rememberMe');
    }
    
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
