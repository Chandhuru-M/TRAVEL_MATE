// app/(tabs)/more.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';

const menuItems = [
  { name: 'Group Travel', icon: 'users', route: '/group' },
  { name: 'Fuel Finder', icon: 'tint', route: '/fuel' },
  { name: 'Profile', icon: 'user', route: '/(tabs)/profile' }, // Stays within tabs
];

export default function MoreScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More Options</Text>
      </View>
      <View style={styles.content}>
        {menuItems.map(item => (
          <TouchableOpacity key={item.name} style={styles.menuItem} onPress={() => router.push(item.route as any)}>
            <FontAwesome name={item.icon as any} size={24} color="#94a3b8" />
            <Text style={styles.menuItemText}>{item.name}</Text>
            <FontAwesome name="chevron-right" size={16} color="#94a3b8" />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  content: { marginTop: 16 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  menuItemText: { color: 'white', fontSize: 18, marginLeft: 20, flex: 1 },
});