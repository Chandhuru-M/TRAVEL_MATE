// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase'; // Import our new client
import { Session } from '@supabase/supabase-js';

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

  // This useEffect hook sets up the Supabase auth listener
  useEffect(() => {
    // Start by fetching the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for changes in authentication state (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
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
      // This is the logic from your signIn server action
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error ? error.message : null };
    },
    signUp: async (email, password) => {
      if (!email || !password) {
        return { error: "Email and password are required", successMessage: undefined };
      }
      // This is the logic from your signUp server action
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        return { error: error.message, successMessage: undefined };
      }
      return { error: null, successMessage: "Check your email to confirm your account." };
    },
    signOut: async () => {
      // This is the logic from your signOut server action
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