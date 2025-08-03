import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

// FIX: Corrected the import path to use the '@/' alias.
// import { Colors, sizes } from '@/constants';
import { Colors, sizes } from '@/constants';

// A custom component for the central chat button
const ChatTabIcon = ({ color, focused }: { color: string; focused: boolean }) => (
  <View style={[styles.chatIconContainer, focused && styles.chatIconFocused]}>
    <Ionicons name={focused ? "chatbubble" : "chatbubble-outline"} size={30} color={focused ? Colors.light.cardBackground : color} />
  </View>
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.light.cardBackground,
          position: 'absolute',
          bottom: 25,
          left: 20,
          right: 20,
          elevation: 5,
          borderRadius: sizes.borderRadius.lg,
          height: 70,
          shadowColor: Colors.light.text,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          borderTopWidth: 0,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={sizes.icon} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'compass' : 'compass-outline'} size={sizes.icon} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'AI Chat',
          tabBarIcon: (props) => <ChatTabIcon {...props} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} size={sizes.icon} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={sizes.icon} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  chatIconContainer: {
    top: -25,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.cardBackground,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  chatIconFocused: {
    backgroundColor: Colors.light.primary,
  },
});