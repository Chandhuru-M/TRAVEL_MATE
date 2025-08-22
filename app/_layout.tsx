// app/_layout.tsx
import React, { useEffect } from 'react';
import { SplashScreen, Stack, router } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

const RootLayoutNav = () => {
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
      if (session) {
        // If user is logged in, redirect to the main app
        router.replace('/(tabs)/explore');
      } else {
        // If user is logged out, redirect to the login screen
        router.replace('/login');
      }
    }
  }, [session, isLoading]);

  // Show a splash screen while the session is loading
  if (isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}