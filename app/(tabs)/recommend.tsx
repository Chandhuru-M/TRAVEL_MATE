// app/(tabs)/recommend.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const categories = ["Food & Dining", "Hotels", "Landmarks", "ATMs", "Gas Stations", "Shopping"];

export default function RecommendScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Places</Text>
        <Text style={styles.headerSubtitle}>Discover amazing places around you</Text>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <TextInput style={styles.input} placeholder="Search restaurants, hotels..." placeholderTextColor="#94a3b8" />
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Categories</Text>
          <View style={styles.badgeContainer}>
            {categories.map(cat => (
              <TouchableOpacity key={cat} style={styles.badge}>
                <Text style={styles.badgeText}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.placeholder}>
          <FontAwesome name="map-pin" size={50} color="#64748b" />
          <Text style={styles.placeholderText}>Search results will appear here.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 16, backgroundColor: '#1e293b' },
  headerTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { color: '#94a3b8', fontSize: 16 },
  content: { padding: 16 },
  card: { backgroundColor: '#1e293b', borderRadius: 8, padding: 16, marginBottom: 16 },
  cardTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: { color: 'white', fontSize: 16 },
  badgeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { backgroundColor: '#334155', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16 },
  badgeText: { color: 'white' },
  placeholder: { alignItems: 'center', marginTop: 40 },
  placeholderText: { color: '#94a3b8', marginTop: 16, fontSize: 16 },
});