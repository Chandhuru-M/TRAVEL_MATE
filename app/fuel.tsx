// app/fuel.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export default function FuelScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <FontAwesome name="tint" size={80} color="#64748b" />
        <Text style={styles.title}>Fuel Recommender</Text>
        <Text style={styles.placeholderText}>The fuel level simulation and station recommendation UI will be integrated here.</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Manual Mode</Text></TouchableOpacity>
          <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Simulated Mode</Text></TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 24, marginBottom: 12 },
  placeholderText: { color: '#94a3b8', fontSize: 16, textAlign: 'center', marginBottom: 40 },
  buttonContainer: { flexDirection: 'row', gap: 16 },
  button: { backgroundColor: '#2563eb', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  buttonText: { color: 'white', fontWeight: 'bold' },
});