// app/(tabs)/explore.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text, SafeAreaView } from 'react-native';
import { Place } from '@/lib/types';
import { fetchPlaces } from '@/lib/foursquare';
import PlaceCard from '../../src/components/PlaceCard'; // Corrected path

export default function ExploreScreen() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlaces = async () => {
      try {
        // Using a fixed location for now
        const fetchedPlaces = await fetchPlaces({
          lat: 37.7749,
          lon: -122.4194,
        });
        setPlaces(fetchedPlaces);
      } catch (e) {
        setError('Failed to load places. Please try again later.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlaces();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={places}
        renderItem={({ item }) => <PlaceCard place={item} />}
        keyExtractor={(item, index) => item.fsq_id || index.toString()}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // --- STYLES UPDATED FOR DARK THEME ---
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Dark background
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a', // Dark background
  },
  errorText: {
    fontSize: 16,
    color: '#f87171', // Lighter red for dark background
  },
  list: {
    paddingTop: 8,
    paddingBottom: 8,
  },
});