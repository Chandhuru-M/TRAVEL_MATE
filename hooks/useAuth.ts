// hooks/useAuth.ts
import { useContext } from 'react';
import { AuthContext, AuthContextType } from '@/context/AuthContext'; // Use alias

/**
 * A custom hook to provide easy access to the AuthContext.
 * Throws an error if used outside of an AuthProvider.
 * @returns The authentication context value.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};