// app/fuel.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import * as Location from 'expo-location';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useHeaderHeight } from '@react-navigation/elements';
import { useRouter } from 'expo-router'

const FUEL_THRESHOLD = 25; // Recommend refueling when below 25%

export default function FuelScreen() {
  const [error, setError] = useState<string | null>(null);
  const [fuelLevel, setFuelLevel] = useState('80'); // Manual input
  const [isSimulated, setIsSimulated] = useState(false);
  const headerHeight = useHeaderHeight();
  const router = useRouter()
  const [safeMessage, setSafeMessage] = useState<string | null>(null);

  const findNearbyGasStations = useCallback(async () => {
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      // Use expo-router to navigate to the FuelStations screen with params
      try {
        router.push({ pathname: '/FuelStations', params: { latitude, longitude } } as any)
      } catch {
        // Fallback: push simple path
        router.push(`/FuelStations?latitude=${latitude}&longitude=${longitude}` as any)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get location.');
    }
  }, [router]);

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
    setSafeMessage(null);
    const currentFuel = parseFloat(fuelLevel);
    if (!isNaN(currentFuel) && currentFuel < FUEL_THRESHOLD) {
      findNearbyGasStations();
    } else if (isNaN(currentFuel)) {
      setError("Please enter a valid fuel percentage.");
    } else {
      setSafeMessage('Fuel level is safe.');
    }
  };

  // Removed handleNavigation and station list logic

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.content, { paddingTop: headerHeight }]}> 
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
  {safeMessage && (
          <View style={styles.recommendationHeader}>
            <Text style={styles.recommendationTitle}>{safeMessage}</Text>
          </View>
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { flex: 1, paddingHorizontal: 20, justifyContent: 'flex-start', paddingTop: 10 },
  controlsContainer: {
    padding: 10,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginVertical: 0,
    marginTop: 0,
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
    marginBottom: 10,
    marginTop: 10,
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