// app/pre-booking.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';

export default function PreBookingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <FontAwesome name="ticket" size={80} color="#64748b" />
        <Text style={styles.title}>Pre-Bookings</Text>
        <Text style={styles.subtitle}>Viewing and managing pre-booked tickets and hotels will be here.</Text>
      </View>
    </SafeAreaView>
  );
}
// Add styles similar to TripPlannerScreen
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginTop: 20 },
  subtitle: { fontSize: 16, color: '#94a3b8', marginTop: 8, textAlign: 'center' },
});