// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext'; // 1. Import the useTheme hook
import { colors } from '@/constants/Colors'; // 2. Import our color palette

export default function TabLayout() {
  const { theme } = useTheme(); // 3. Get the current theme

  return (
    <Tabs
      screenOptions={{
        // 4. Make all colors dynamic based on the theme
        tabBarActiveTintColor: colors.primary[theme],
        tabBarInactiveTintColor: colors.textMuted[theme], // Set color for inactive tabs
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background[theme], // Dynamic background color
          borderTopColor: colors.border[theme],      // Dynamic border color
          height: 70,
          paddingBottom: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <FontAwesome name="home" size={28} color={color} /> }}
      />
      <Tabs.Screen
        name="map"
        options={{ title: 'Map', tabBarIcon: ({ color }) => <FontAwesome name="map-marker" size={28} color={color} /> }}
      />
      <Tabs.Screen
        name="trip-planner"
        options={{ title: 'Trip Planner', tabBarIcon: ({ color }) => <FontAwesome name="suitcase" size={28} color={color} /> }}
      />
      <Tabs.Screen
        name="wallet"
        options={{ title: 'Wallet', tabBarIcon: ({ color }) => <FontAwesome name="google-wallet" size={28} color={color} /> }}
      />
      <Tabs.Screen
        name="pre-booking"
        options={{ title: 'Bookings', tabBarIcon: ({ color }) => <FontAwesome name="ticket" size={28} color={color} /> }}
      />
    </Tabs>
  );
}