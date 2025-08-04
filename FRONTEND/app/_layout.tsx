// app/_layout.tsx (Final Corrected Version)
import React, { useEffect } from 'react';
import { SplashScreen, Slot } from 'expo-router';
import { useFonts } from 'expo-font';

// FIX: Corrected the import paths
import { AuthProvider } from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  // This now correctly uses the hook from '@/hooks/useAuth'
  const { isLoading } = useAuth();

  useEffect(() => {
    // Hide the splash screen once the auth state is determined
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  // If we are still loading the auth state, the splash screen remains visible
  if (isLoading) {
    return null;
  }

  // The useProtectedRoute hook in AuthContext will handle all redirection.
  // <Slot /> simply renders the currently active route.
  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': require('@/assets/fonts/Inter-Regular.ttf'),
    'Inter-Bold': require('@/assets/fonts/Inter-Bold.ttf'),
  });

  // This effect can also help hide the splash screen once fonts are ready
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Don't render anything until the fonts are loaded
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}