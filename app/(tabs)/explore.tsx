// app/(tabs)/explore.tsx

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text } from 'react-native';
import { Place } from '@/lib/types';
import { fetchPlaces } from '@/lib/foursquare';
import PlaceCard from '@/components/PlaceCard';

export default function ExploreScreen() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlaces = async () => {
      try {
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
        <ActivityIndicator size="large" color="#0000ff" />
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
    <FlatList
      data={places}
      renderItem={({ item }) => <PlaceCard place={item} />}
      // --- THIS IS THE MORE ROBUST FIX ---
      // It uses the unique fsq_id, but if it's missing, it falls back to the item's index.
      keyExtractor={(item, index) => item.fsq_id || index.toString()}
      // ------------------------------------
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
  list: {
    paddingTop: 8,
    paddingBottom: 8,
  },
});