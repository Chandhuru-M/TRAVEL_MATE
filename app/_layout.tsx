// app/_layout.tsx
import React from 'react';
import { Stack, SplashScreen, router } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import FloatingVoiceButton from '../src/components/FloatingVoiceButton';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext'; // Import ThemeProvider and useTheme
import { colors } from '../src/constants/Colors'; // Import our color palette

const RootLayoutNav = () => {
  const { session, isLoading } = useAuth();
  const { theme } = useTheme(); // Get the current theme

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
      if (session) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/login');
      }
    }
  }, [session, isLoading]);

  if (isLoading) return null;

  // --- THIS IS THE FIX ---
  // Define the header styles dynamically based on the current theme
  const headerStyleOptions = {
    headerShown: true,
    headerStyle: {
      backgroundColor: colors.background[theme],
    },
    headerTintColor: colors.text[theme],
    headerTitleStyle: {
      fontWeight: 'bold' as 'bold',
    },
  };
  // -----------------------

  return (
    <View style={styles.container}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        {/* Apply the dynamic header styles to all stack screens */}
        <Stack.Screen name="place/[id]" options={{ ...headerStyleOptions, title: "Place Details" }} />
        <Stack.Screen name="group" options={{ ...headerStyleOptions, title: "Group Travel" }} />
        <Stack.Screen name="fuel" options={{ ...headerStyleOptions, title: "Fuel Finder" }} />
        <Stack.Screen name="profile" options={{ ...headerStyleOptions, title: "Profile & Settings" }} />
      </Stack>
      {session && <FloatingVoiceButton />}
    </View>
  );
};

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });