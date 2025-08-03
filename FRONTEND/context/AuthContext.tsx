import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';

// Export the type definition
export interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

// Export the context object
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function useProtectedRoute(user: any) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/sign-in');
    } else if (user && inAuthGroup) {
      router.replace('/');
    }
  }, [user, segments, router]);
}

// The provider component that wraps your app
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setUser(null);
      setIsLoading(false);
    }, 1000);
  }, []);

  useProtectedRoute(user);

  const login = async (email: string, pass: string) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setUser({ email, name: 'Wanderer' });
        resolve();
      }, 1000);
    });
  };

  const register = async (email: string, pass: string, name: string) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setUser({ email, name });
        resolve();
      }, 1000);
    });
  };

  const logout = async () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setUser(null);
        resolve();
      }, 500);
    });
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// THE FIX: The useAuth hook that was here has been DELETED.
// It should only exist in hooks/useAuth.ts