// app/fuel.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, FlatList, TextInput, Switch, Linking, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Location from 'expo-location';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { fetchPlaces } from '@/lib/foursquare';
import { Place } from '@/lib/types';
import { useHeaderHeight } from '@react-navigation/elements';

const FUEL_THRESHOLD = 25; // Recommend refueling when below 25%

export default function FuelScreen() {
  const [loading, setLoading] = useState(false);
  const [stations, setStations] = useState<Place[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fuelLevel, setFuelLevel] = useState('80'); // Manual input
  const [isSimulated, setIsSimulated] = useState(false);
  const headerHeight = useHeaderHeight();

  const findNearbyGasStations = useCallback(async () => {
    setLoading(true);
    setError(null);
    setStations([]);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const results = await fetchPlaces({
        lat: latitude,
        lon: longitude,
        query: 'gas station',
        limit: 10,
        radius: 10000, // 10km radius
      });
      
      setStations(results);
    } catch (err: any) {
      setError(err.message || 'Failed to find nearby gas stations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSimulated) {
      const interval = setInterval(() => {
        setFuelLevel(prev => {
          const newLevel = Math.max(0, parseFloat(prev) - 2);
          if (newLevel < FUEL_THRESHOLD) {
            findNearbyGasStations();
          }
          return newLevel.toFixed(0);
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isSimulated, findNearbyGasStations]);

  const handleManualCheck = () => {
    const currentFuel = parseFloat(fuelLevel);
    if (!isNaN(currentFuel) && currentFuel < FUEL_THRESHOLD) {
      findNearbyGasStations();
    } else if (isNaN(currentFuel)) {
      setError("Please enter a valid fuel percentage.");
    } else {
      setStations([]); // Clear stations if fuel is not low
    }
  };

  const handleNavigation = (place: Place) => {
    if (place.geocodes?.main) {
      const { lat, lng } = place.geocodes.main;
      const scheme = Platform.OS === 'ios' ? 'maps:0,0?q=' : 'geo:0,0?q=';
      const latLng = `${lat},${lng}`;
      const label = place.name;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latLng}`;
      Linking.openURL(url);
    } else {
      setError("No location data available for this station to start navigation.");
    }
  };
  
  const numericFuelLevel = parseFloat(fuelLevel);
  const isFuelLow = !isNaN(numericFuelLevel) && numericFuelLevel < FUEL_THRESHOLD;

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.content, { paddingTop: headerHeight }]}>
        <View style={styles.controlsContainer}>
          <View style={styles.toggleContainer}>
            <Text style={styles.label}>Manual</Text>
            <Switch
              value={isSimulated}
              onValueChange={setIsSimulated}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={isSimulated ? "#2563eb" : "#f4f3f4"}
            />
            <Text style={styles.label}>Simulated</Text>
          </View>

          {!isSimulated && (
            <View style={styles.manualInputContainer}>
              <TextInput
                style={styles.input}
                value={fuelLevel}
                onChangeText={setFuelLevel}
                placeholder="Fuel %"
                keyboardType="numeric"
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity style={styles.button} onPress={handleManualCheck}>
                <Text style={styles.buttonText}>Check Fuel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {isFuelLow && (
          <View style={styles.recommendationHeader}>
            <FontAwesome name="exclamation-triangle" size={20} color="#facc15" />
            <Text style={styles.recommendationTitle}>Fuel Low! Consider refueling at:</Text>
          </View>
        )}

        {loading && <ActivityIndicator size="large" color="#3b82f6" style={{ marginVertical: 20 }} />}
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        <FlatList
          data={stations}
          keyExtractor={(item) => item.fsq_id || uuidv4()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleNavigation(item)}>
              <View style={styles.stationCard}>
                <FontAwesome name="tint" size={24} color="#a5b4fc" />
                <View style={styles.stationInfo}>
                  <Text style={styles.stationName}>{item.name}</Text>
                  <Text style={styles.stationAddress}>{item.location?.formatted_address || 'Address not available'}</Text>
                  <Text style={styles.stationDistance}>{item.distance ? `${(item.distance / 1000).toFixed(1)} km away` : ''}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            !loading && isFuelLow && <Text style={styles.placeholderText}>No gas stations found nearby.</Text>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { flex: 1, paddingHorizontal: 20 },
  controlsContainer: {
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginVertical: 0,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom:16,
  },
  label: {
    color: 'white',
    fontSize: 16,
    marginHorizontal: 10,
  },
  manualInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#0f172a',
    color: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  button: { 
    backgroundColor: '#2563eb', 
    paddingVertical: 12, 
    paddingHorizontal: 18, 
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  recommendationTitle: {
    color: '#facc15',
    fontSize: 19,
    fontWeight: 'bold',
    marginLeft: 12,
  },
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
  }
});