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

    // Handle redirect result first (for WebView)
    const handleRedirect = async () => {
      try {
        const redirectUser = await handleRedirectResult();
        if (redirectUser && mounted) {
          setUser(redirectUser);
          dataSyncService.setUser(redirectUser);
        }
      } catch (err) {
        console.error('Error handling redirect:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Authentication error');
        }
      }
    };

    // Set up auth state listener
    const unsubscribe = onAuthStateChange((authUser) => {
      if (mounted) {
        setUser(authUser);
        dataSyncService.setUser(authUser);
        setLoading(false);
        setError(null);
      }
    });

    // Check for redirect result and current user
    handleRedirect().then(() => {
      if (mounted) {
        const currentUser = getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          dataSyncService.setUser(currentUser);
        }
        setLoading(false);
      }
    });

    // Sync status updates
    const syncStatusInterval = setInterval(() => {
      if (mounted) {
        setSyncStatus(dataSyncService.getSyncStatus());
      }
    }, 1000);

    return () => {
      mounted = false;
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