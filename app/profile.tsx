// app/profile.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const { signOut } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Add other settings items here in the future */}
        <TouchableOpacity style={[styles.menuItem, styles.logoutButton]} onPress={signOut}>
            <FontAwesome name="sign-out" size={22} color="#be123c" />
            <Text style={[styles.menuItemText, styles.logoutText]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { marginTop: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 20, borderBottomWidth: 1, borderBottomColor: '#0f172a' },
  menuItemText: { color: 'white', fontSize: 18, marginLeft: 20, flex: 1 },
  logoutButton: { marginTop: 32 },
  logoutText: { color: '#be123c' },
});