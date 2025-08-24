// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useFinanceStore } from '../services/financeService'; // Import the new finance store

// Define the shape of the context value
interface AuthContextType {
  session: Session | null;
  signIn: (email?: string, password?: string) => Promise<{ error: string | null }>;
  signUp: (email?: string, password?: string) => Promise<{ error: string | null; successMessage?: string }>;
  signOut: () => void;
  isLoading: boolean;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the AuthProvider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for an existing session when the app starts
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // If a session already exists on startup, fetch the financial data
      if (session) {
        useFinanceStore.getState().fetchData();
      }
      setIsLoading(false);
    });

    // Listen for changes in authentication state (e.g., user signs in or out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      // --- INTEGRATION WITH FINANCE SERVICE ---
      if (session) {
        // A user has just logged in. Fetch their accounts and transactions.
        useFinanceStore.getState().fetchData();
      } else {
        // A user has just logged out. We can clear the data if needed,
        // but the next login will fetch fresh data anyway.
        // useFinanceStore.getState().clearData(); // Optional: create a clearData function
      }
    });

    // Cleanup the subscription when the component unmounts
    return () => subscription.unsubscribe();
  }, []);

  const authContextValue: AuthContextType = {
    session,
    isLoading,
    signIn: async (email, password) => {
      if (!email || !password) {
        return { error: "Email and password are required" };
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error ? error.message : null };
    },
    signUp: async (email, password) => {
      if (!email || !password) {
        return { error: "Email and password are required", successMessage: undefined };
      }
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        return { error: error.message, successMessage: undefined };
      }
      return { error: null, successMessage: "Check your email to confirm your account." };
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
};

// Create a custom hook for easy access to the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};