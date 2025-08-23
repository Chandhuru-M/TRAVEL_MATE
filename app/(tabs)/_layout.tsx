// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0f172a', borderTopColor: '#334155', height: 60, paddingBottom: 5 },
        tabBarLabelStyle: { fontSize: 12 },
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