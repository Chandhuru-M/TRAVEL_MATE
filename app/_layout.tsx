import React, { useEffect } from 'react';
import { SplashScreen, Stack } from 'expo-router';
import { useFonts } from 'expo-font';
// Correctly import AuthProvider from context...
import { AuthProvider } from '@/context/AuthContext';
// ...and correctly import useAuth from hooks
import { useAuth } from '@/hooks/useAuth';


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const [fontsLoaded, fontError] = useFonts({
    // FIX: Changed the paths to use the '@/' alias for robustness.
    'Inter-Regular': require('@/assets/fonts/Inter-Regular.ttf'),
    'Inter-Bold': require('@/assets/fonts/Inter-Bold.ttf'),
  });

  useEffect(() => {
    // Hide the splash screen once fonts are loaded and auth state is determined.
    if ((fontsLoaded || fontError) && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isLoading]);

  // If fonts are not loaded yet, or we are still checking auth, show nothing.
  // The splash screen is still visible.
  if (!fontsLoaded && !fontError || isLoading) {
    return null;
  }

  // If everything is loaded, render the correct navigation stack.
  return (
    <Stack>
      {isAuthenticated ? (
        // User is signed in, show the main app
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      ) : (
        // User is not signed in, show the auth flow
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}