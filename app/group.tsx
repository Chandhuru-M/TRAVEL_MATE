// app/group.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export default function GroupScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <FontAwesome name="users" size={80} color="#64748b" />
        <Text style={styles.placeholderText}>Group Location Sharing UI will be integrated here.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  placeholderText: { color: '#94a3b8', marginTop: 24, fontSize: 16, textAlign: 'center' },
});