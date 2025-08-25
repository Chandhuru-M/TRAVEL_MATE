// app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack, SplashScreen, router } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { View, StyleSheet } from 'react-native';
import FloatingChatButton from '../src/components/FloatingChatButton';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { colors } from '../src/constants/Colors';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
        <Stack.Screen name="add-transaction" options={{ ...headerStyleOptions, title: "Add New Transaction", presentation: 'modal' }} />
        <Stack.Screen name="chat" options={{ ...headerStyleOptions, title: "AI Assistant", presentation: 'modal' }} />
        <Stack.Screen name="create-account" options={{ ...headerStyleOptions, title: "Create New Account", presentation: 'modal' }} />
        <Stack.Screen name="transaction-history" options={{ ...headerStyleOptions, title: "Transaction History" }} />
        <Stack.Screen name="trip/[id]" options={{ ...headerStyleOptions, title: "Trip Details" }} />
        <Stack.Screen name="add-to-itinerary" options={{ ...headerStyleOptions, title: "Add to Itinerary", presentation: 'modal' }} />
      
      </Stack>
      {session && <FloatingChatButton />}
    </View>
  );
};
export default function RootLayout() {
  // The wrapper is removed
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });