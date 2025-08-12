// frontend/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { supabase, checkSupabaseConfig } from '@/lib/supabase';
import { Session, User, AuthError } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  register: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isConfigValid: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Protected route hook
function useProtectedRoute(user: User | null) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // User is not authenticated and not in auth group, redirect to sign-in
      router.replace('/sign-in');
    } else if (user && inAuthGroup) {
      // User is authenticated and in auth group, redirect to main app
      router.replace('/');
    }
  }, [user, segments, router]);
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigValid, setIsConfigValid] = useState(false);

  // Check Supabase configuration
  useEffect(() => {
    const config = checkSupabaseConfig();
    setIsConfigValid(config.isConfigured);
    
    if (!config.isConfigured) {
      console.error('Supabase not configured:', config.missing);
      setIsLoading(false);
      return;
    }
  }, []);

  useEffect(() => {
    if (!isConfigValid) return;

    const fetchSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error fetching session:', error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error in fetchSession:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isConfigValid]);

  // Protected route logic
  useProtectedRoute(user);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      return { error };
    } catch (error) {
      console.error('Login error:', error);
      return { error: error as AuthError };
    }
  };
  
  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            avatar_url: `https://i.pravatar.cc/150?u=${email}`
          }
        }
      });
      return response; // Return full response for debugging
    } catch (error) {
      console.error('Registration error:', error);
      return { error: error as AuthError, data: null };
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    isLoading,
    isConfigValid,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};