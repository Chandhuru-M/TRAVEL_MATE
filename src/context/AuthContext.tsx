// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useWalletStore } from '../services/walletService';

interface AuthContextType {
  session: Session | null;
  signIn: (email?: string, password?: string) => Promise<{ error: string | null }>;
  signUp: (email?: string, password?: string) => Promise<{ error: string | null; successMessage?: string }>;
  signOut: () => void;
  isLoading: boolean;
}

// --- THIS IS THE FIX ---
// Corrected the typo from 'Auth-ContextType' to 'AuthContextType'
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        useWalletStore.getState().clearWalletData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const authContextValue: AuthContextType = {
    session,
    isLoading,
    signIn: async (email, password) => {
      if (!email || !password) { return { error: "Email and password are required" }; }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error ? error.message : null };
    },
    signUp: async (email, password) => {
      if (!email || !password) { return { error: "Email and password are required", successMessage: undefined }; }
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { return { error: error.message, successMessage: undefined }; }
      return { error: null, successMessage: "Check your email to confirm your account." };
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) { throw new Error('useAuth must be used within an AuthProvider'); }
  return context;
};