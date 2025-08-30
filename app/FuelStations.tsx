// app/FuelStations.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Linking } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { fetchPlaces } from '@/lib/foursquare';
import { Place } from '@/lib/types';
import { RouteProp, useRoute } from '@react-navigation/native';

type FuelStationsRouteParams = {
  latitude: number;
  longitude: number;
};

export default function FuelStations() {
  const route = useRoute();
  // @ts-ignore
  const params = (route as any)?.params as FuelStationsRouteParams | undefined;
  const latitude = params?.latitude;
  const longitude = params?.longitude;
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState<Place[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      setError('No location data provided.');
      setLoading(false);
      return;
    }
    const getStations = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await fetchPlaces({
          lat: latitude,
          lon: longitude,
          query: 'gas station',
          limit: 10,
          radius: 10000,
        });
        setStations(results);
      } catch (err: any) {
        setError(err.message || 'Failed to find nearby gas stations.');
      } finally {
        setLoading(false);
      }
    };
    getStations();
  }, [latitude, longitude]);

  const handleNavigation = (place: Place) => {
    if (place.geocodes?.main) {
      const { lat, lng } = place.geocodes.main;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      Linking.openURL(url);
    } else {
      setError('No location data available for this station to start navigation.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Nearby Fuel Stations</Text>
      {loading && <ActivityIndicator size="large" color="#3b82f6" style={{ marginVertical: 20 }} />}
      {error && <Text style={styles.errorText}>{error}</Text>}
      <FlatList
        data={stations}
        keyExtractor={(item) => item.fsq_id}
        renderItem={({ item }) => (
          <View style={styles.stationCard}>
            <FontAwesome name="tint" size={24} color="#a5b4fc" style={{ marginRight: 8 }} />
            <View style={styles.stationInfo}>
              <Text style={styles.stationName}>{item.name}</Text>
              <Text style={styles.stationAddress}>{item.location?.formatted_address || 'Address not available'}</Text>
              <Text style={styles.stationDistance}>{item.distance ? `${(item.distance / 1000).toFixed(1)} km away` : ''}</Text>
            </View>
            <TouchableOpacity onPress={() => handleNavigation(item)} style={styles.mapPinButton} accessibilityLabel="Open in Maps">
              <FontAwesome name="map-pin" size={24} color="#38bdf8" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          !loading && <Text style={styles.placeholderText}>No gas stations found nearby.</Text>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20 },
  header: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  errorText: { color: '#fca5a5', textAlign: 'center', marginVertical: 12 },
  placeholderText: { color: '#94a3b8', fontSize: 16, textAlign: 'center', marginTop: 40 },
  stationCard: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stationInfo: {
    marginLeft: 16,
    flex: 1,
  },
  stationName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  stationAddress: {
    color: '#cbd5e1',
    fontSize: 14,
    marginTop: 4,
  },
  stationDistance: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  mapPinButton: {
    marginLeft: 12,
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
});
