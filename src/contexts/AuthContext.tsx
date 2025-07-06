'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChange, handleRedirectResult, getCurrentUser } from '@/lib/auth';
import { dataSyncService } from '@/lib/dataSync';
import type { User, SyncStatus } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  syncStatus: SyncStatus;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(dataSyncService.getSyncStatus());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Check for auth URL parameter (from system browser)
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get('auth') === 'google') {
            console.log('Auth parameter detected, attempting Google sign-in');
            // Clear the URL parameter
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }

        // Handle redirect result first (for WebView)
        const redirectUser = await handleRedirectResult();
        if (redirectUser && mounted) {
          setUser(redirectUser);
          dataSyncService.setUser(redirectUser);
        }

        // Check for current user
        const currentUser = getCurrentUser();
        if (currentUser && mounted) {
          setUser(currentUser);
          dataSyncService.setUser(currentUser);
        }
      } catch (err) {
        console.error('Error in auth initialization:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Authentication error');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const unsubscribe = onAuthStateChange((authUser) => {
      if (mounted) {
        setUser(authUser);
        dataSyncService.setUser(authUser);
        setError(null);
      }
    });

    // Initialize auth with timeout fallback
    const authTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth initialization timeout, proceeding without authentication');
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    initAuth();

    // Sync status updates
    const syncStatusInterval = setInterval(() => {
      if (mounted) {
        setSyncStatus(dataSyncService.getSyncStatus());
      }
    }, 1000);

    return () => {
      mounted = false;
      clearTimeout(authTimeout);
      unsubscribe();
      clearInterval(syncStatusInterval);
    };
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    syncStatus,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 