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
        name="explore"
        options={{ title: 'Explore', tabBarIcon: ({ color }) => <FontAwesome name="search" size={28} color={color} /> }}
      />
      <Tabs.Screen
        name="recommend"
        options={{ title: 'Recommend', tabBarIcon: ({ color }) => <FontAwesome name="star" size={28} color={color} /> }}
      />
      <Tabs.Screen
        name="chat"
        options={{ title: 'Chat', tabBarIcon: ({ color }) => <FontAwesome name="comments" size={28} color={color} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: 'More', tabBarIcon: ({ color }) => <FontAwesome name="bars" size={28} color={color} /> }}
      />
    </Tabs>
  );
}