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
        // --- UI ENHANCEMENT: Make the tab bar taller and labels bigger ---
        tabBarStyle: {
          backgroundColor: '#0f172a', // Match the dark theme
          borderTopColor: '#334155',
          height: 60, // Increase height
          paddingBottom: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12, // Increase label font size
        },
      }}>
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          // --- UI ENHANCEMENT: Increased icon size ---
          tabBarIcon: ({ color }) => <FontAwesome name="search" size={28} color={color} />,
        }}
      />
      {/* --- BUG FIX: Added the Map screen back --- */}
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          // --- UI ENHANCEMENT: Increased icon size ---
          tabBarIcon: ({ color }) => <FontAwesome name="map-marker" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          // --- UI ENHANCEMENT: Changed icon to user symbol and increased size ---
          tabBarIcon: ({ color }) => <FontAwesome name="user" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}