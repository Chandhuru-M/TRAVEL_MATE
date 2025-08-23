// app/_layout.tsx
import React, { useEffect } from 'react'; // Import useEffect
import { Stack, SplashScreen, router } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext'; // Import Auth context
import { View, StyleSheet } from 'react-native'; // Import View and StyleSheet
import FloatingVoiceButton from '../src/components/FloatingVoiceButton'; // Import Floating Button
import { StatusBar } from 'expo-status-bar'; // Import StatusBar
import { ThemeProvider, useTheme } from '../src/context/ThemeContext'; // Import Theme context
import { colors } from '../src/constants/Colors'; // Import colors

const RootLayoutNav = () => {
  const { session, isLoading } = useAuth();
  const { theme } = useTheme();

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

  const headerStyleOptions = {
    headerShown: true,
    headerStyle: { backgroundColor: colors.background[theme] },
    headerTintColor: colors.text[theme],
    headerTitleStyle: { fontWeight: 'bold' as 'bold' },
  };

  return (
    <View style={styles.container}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="place/[id]" options={{ ...headerStyleOptions, title: "Place Details" }} />
        <Stack.Screen name="group" options={{ ...headerStyleOptions, title: "Group Travel" }} />
        <Stack.Screen name="fuel" options={{ ...headerStyleOptions, title: "Fuel Finder" }} />
        <Stack.Screen name="profile" options={{ ...headerStyleOptions, title: "Profile" }} />
        <Stack.Screen name="settings" options={{ ...headerStyleOptions, title: "Settings" }} />
        <Stack.Screen name="create-trip" options={{ ...headerStyleOptions, title: "Create a New Trip" }} />
        <Stack.Screen name="add-transaction" options={{ ...headerStyleOptions, title: "Add New Transaction", presentation: 'modal' }} />
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