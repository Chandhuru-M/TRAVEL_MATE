import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function Directions() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const destLat = Number(params.lat);
  const destLng = Number(params.lng);
  const destName = (params.name as string) || 'Destination';
  const openInMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;
    Linking.openURL(url).catch(() => {});
  };
  return (
    <View style={styles.container}>
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Directions</Text>
        <Text style={styles.fallbackText}>Open the route in Google Maps.</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.title} numberOfLines={1}>Directions to {destName}</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.button, { backgroundColor: '#e5e7eb' }]}> 
            <Text style={[styles.buttonText, { color: '#111827' }]}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openInMaps} style={[styles.button, { backgroundColor: '#2563eb' }]}> 
            <Text style={[styles.buttonText, { color: 'white' }]}>Open in Google Maps</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  fallbackTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  fallbackText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  footer: { padding: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e5e7eb', backgroundColor: 'white' },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 8 },
  button: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  buttonText: { fontSize: 14, fontWeight: '600' },
});
