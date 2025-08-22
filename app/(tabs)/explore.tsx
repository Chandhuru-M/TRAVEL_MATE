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
        // Using a fixed location for now (e.g., San Francisco)
        // We will replace this with the user's actual location later.
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
  }, []); // The empty array ensures this runs only once when the screen mounts

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
      keyExtractor={(item) => item.fsq_id}
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