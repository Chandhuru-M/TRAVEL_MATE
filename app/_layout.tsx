// app/_layout.tsx
import React from 'react';
import { Stack, SplashScreen, router } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import FloatingVoiceButton from '../src/components/FloatingVoiceButton'; // Import the new component

const RootLayoutNav = () => {
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
      if (session) {
        router.replace('/(tabs)/explore');
      } else {
        router.replace('/login');
      }
    }
  }, [session, isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    // --- THIS IS THE CHANGE ---
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="place/[id]" options={{ headerShown: true, headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: 'white', title: "Place Details" }} />
        <Stack.Screen name="group" options={{ headerShown: true, headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: 'white', title: "Group Travel" }} />
        <Stack.Screen name="fuel" options={{ headerShown: true, headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: 'white', title: "Fuel Finder" }} />
      </Stack>
      {/* Show the button only when the user is logged in */}
      {session && <FloatingVoiceButton />}
    </View>
    // --------------------------
  );
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});