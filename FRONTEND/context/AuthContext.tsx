// frontend/context/AuthContext.tsx (Final Corrected Version)
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<any>;
  register: (email: string, pass: string, name: string) => Promise<any>;
  logout: () => Promise<void>;
  isLoading: boolean;
}
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// FIX #1: The useProtectedRoute function was missing. It is now added back in.
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // This line will now work because the function exists.
  useProtectedRoute(user);

  const login = async (email: string, pass: string) => {
    console.log("AuthContext: Attempting real Supabase login...");
    // FIX #2: Corrected the object syntax. It should be { email: email, password: pass }
    return supabase.auth.signInWithPassword({ email: email, password: pass });
  };
  
  const register = async (email: string, pass: string, name: string) => {
    console.log("AuthContext: Attempting real Supabase registration...");
    return supabase.auth.signUp({
      email: email,
      // FIX #3: Corrected the object syntax. It should be { password: pass }
      password: pass,
      options: {
        data: {
          full_name: name,
          avatar_url: `https://i.pravatar.cc/150?u=${email}`
        }
      }
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ```

// ### Explanation of the Fixes

// 1.  **`Cannot find name 'useProtectedRoute'.ts(2304)`**: I had accidentally deleted the entire `useProtectedRoute` function in the previous version. I have now added the full function back into the file, so the line `useProtectedRoute(user);` will work correctly.

// 2.  **`No value exists in scope for the shorthand property 'password'.` (in `login` function)**: This is a JavaScript syntax error. The code was `{ email, password }`. This is "shorthand" for `{ email: email, password: password }`. But the variable holding the password was named `pass`, not `password`. The corrected code is `{ email: email, password: pass }`, which explicitly assigns the value of the `pass` variable to the `password` property that Supabase expects.

// 3.  **`No value exists in scope for the shorthand property 'password'.` (in `register` function)**: This was the exact same error as above, in the `signUp` call. The corrected code is now `{ password: pass }`.

// My apologies for these careless errors. The corrected file above is now syntactically correct and contains all the necessary logic. After replacing the file and restarting your frontend server, these errors will be resolved.