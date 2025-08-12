import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TextInput,
  Button,
  Alert,
  Linking,
  Platform,
  TouchableOpacity,
} from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useInterval } from 'react-use'; // Add this package for interval logic or use setInterval manually

// Use environment variables for API keys
const FOURSQUARE_API_KEY = process.env.EXPO_PUBLIC_FOURSQUARE_API_KEY;
const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
const FUEL_ALERT_THRESHOLD = 20; // Fuel % threshold for alert

// Options for location watching
const WATCH_OPTIONS = { accuracy: Location.Accuracy.Highest, distanceInterval: 10, timeInterval: 7000 };

// Only enable notifications and location watching on native platforms
const isNative = Platform.OS !== 'web';

export default function FuelStationRecommender() {
  // States
  const [fuelLevel, setFuelLevel] = useState(100);
  const [manualFuelInput, setManualFuelInput] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alertSent, setAlertSent] = useState(false);
  const [mode, setMode] = useState<'manual' | 'simulated' | null>(null);
  const watchRef = useRef<any>(null);

  // Request notification permission
  useEffect(() => {
    if (!isNative) return;
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notifications permission not granted');
      }
    })();
  }, []);

  // Request location permission and get initial location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    })();
  }, []);

  // Watch location if alert active
  useEffect(() => {
    if (!isNative) return;
    if (alertSent) {
      startWatchingPosition();
    } else {
      stopWatchingPosition();
    }
    // Cleanup
    return () => stopWatchingPosition();
  }, [alertSent]);

  // Fuel level effect: check and alert if low
  useEffect(() => {
    if (fuelLevel <= FUEL_ALERT_THRESHOLD && !alertSent) {
      setAlertSent(true);
      sendLowFuelAlert(fuelLevel);
      if (location) fetchStationsWithWeather(location.latitude, location.longitude);
    } else if (fuelLevel > FUEL_ALERT_THRESHOLD && alertSent) {
      setAlertSent(false);
      setStations([]);
    }
  }, [fuelLevel, location]);

  // Simulate fuel consumption in simulated mode
  useEffect(() => {
    if (mode === 'simulated') {
      const interval = setInterval(() => {
        setFuelLevel(prev => Math.max(0, prev - 1)); // decrease by 1% every 5 seconds
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [mode]);

  // Watch position to update recommendations dynamically
  const startWatchingPosition = async () => {
    if (watchRef.current) return;
    watchRef.current = await Location.watchPositionAsync(WATCH_OPTIONS, (pos) => {
      const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setLocation(coords);
      fetchStationsWithWeather(coords.latitude, coords.longitude);
    });
  };

  const stopWatchingPosition = () => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
  };

  // Send local notification for low fuel
  const sendLowFuelAlert = async (level: number) => {
    if (!isNative) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Low Fuel Warning',
        body: `Your fuel level is at ${level}%. Finding nearby fuel stations.`,
      },
      trigger: null,
    });
  };

  // Fetch stations + weather, score and sort
  const fetchStationsWithWeather = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);

    try {
      // Fetch stations from Foursquare
      const stationRes = await fetch(
        `https://api.foursquare.com/v3/places/search?ll=${lat},${lon}&radius=5000&categories=17069&limit=10`,
        { headers: { Authorization: FOURSQUARE_API_KEY } }
      );
      if (!stationRes.ok) throw new Error('Foursquare API error');
      const stationData = await stationRes.json();
      if (!stationData.results.length) throw new Error('No fuel stations found');

      // Fetch weather for each station & score
      const stationsWithScores = await Promise.all(
        stationData.results.map(async (station: any) => {
          const sLat = station.geocodes?.main?.latitude;
          const sLon = station.geocodes?.main?.longitude;

          // Fetch weather
          const weatherRes = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${sLat}&lon=${sLon}&appid=${OPENWEATHER_API_KEY}&units=metric`
          );
          const weatherData = await weatherRes.json();

          // Simple weather penalty based on conditions
          let weatherPenalty = 0;
          const condition = (weatherData.weather?.[0]?.main ?? '').toLowerCase();
          if (condition.includes('rain') || condition.includes('drizzle')) weatherPenalty = 100;
          if (condition.includes('snow') || condition.includes('storm')) weatherPenalty = 200;

          // Calculate score = distance + weather penalty
          const distanceMeters = station.distance ?? 1000;
          const score = distanceMeters + weatherPenalty;

          return { ...station, weather: weatherData, score, distanceMeters };
        })
      );

      // Sort by score ascending (best first)
      stationsWithScores.sort((a, b) => a.score - b.score);

      setStations(stationsWithScores);
    } catch (e: any) {
      setError(e.message);
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  // Manual fuel level input handler
  const handleManualInputSubmit = () => {
    const val = parseFloat(manualFuelInput);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      setFuelLevel(val);
      setMode('manual');
      setManualFuelInput('');
    } else {
      Alert.alert('Invalid input', 'Enter a valid fuel level between 0 and 100');
    }
  };

  // Simulate fuel level (random between 5 and 100)
  const handleSimulate = () => {
    const simulatedLevel = Math.floor(Math.random() * 96) + 5;
    setFuelLevel(simulatedLevel);
    setMode('simulated');
    setManualFuelInput('');
    Alert.alert('Simulated Fuel Level', `Simulated fuel level: ${simulatedLevel}%`);
  };

  // UI for mode selection
  if (mode === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Choose Fuel Recommendation Mode</Text>
        <View style={styles.modeButtons}>
          <TouchableOpacity style={styles.modeButton} onPress={() => setMode('manual')}>
            <Text style={styles.modeButtonText}>Manual</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modeButton} onPress={handleSimulate}>
            <Text style={styles.modeButtonText}>Simulated</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fuel Level & Optimal Station Recommender</Text>

      <View style={styles.fuelRow}>
        <Text style={styles.fuelLevelText}>
          Fuel Level: {fuelLevel.toFixed(1)}%
          {mode === 'simulated' && ' (Simulated)'}
        </Text>
        <TouchableOpacity style={styles.smallButton} onPress={() => setFuelLevel(Math.max(0, fuelLevel - 10))}>
          <Text style={styles.smallButtonText}>-10%</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallButton} onPress={() => { setMode(null); setStations([]); }}>
          <Text style={styles.smallButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      {mode === 'manual' && (
        <View style={styles.manualInputRow}>
          <TextInput
            style={styles.input}
            placeholder="Enter fuel level (0-100)"
            keyboardType="numeric"
            value={manualFuelInput}
            onChangeText={setManualFuelInput}
          />
          <TouchableOpacity style={styles.setButton} onPress={handleManualInputSubmit}>
            <Text style={styles.setButtonText}>Set</Text>
          </TouchableOpacity>
        </View>
      )}

      {fuelLevel <= FUEL_ALERT_THRESHOLD && (
        <View style={styles.alertBox}>
          <Text style={styles.alertText}>⚠️ Low fuel detected! Recommendations below:</Text>
        </View>
      )}

      {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}

      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}

      <FlatList
        data={stations}
        keyExtractor={(item) => item.fsq_id}
        renderItem={({ item }) => (
          <View style={[styles.card, item === stations[0] ? styles.bestCard : null]}>
            <Text style={styles.stationName}>{item.name}</Text>
            <Text style={styles.stationAddress}>{item.location?.address || 'Address unavailable'}</Text>
            <Text style={styles.stationInfo}>Distance: {Math.round(item.distanceMeters)} meters</Text>
            <Text style={styles.stationInfo}>Weather: {item.weather?.weather?.[0]?.main || 'N/A'}</Text>
            <Text style={styles.stationInfo}>Score: {Math.round(item.score)}</Text>
            <TouchableOpacity
              style={styles.navigateButton}
              onPress={() => {
                const sLat = item.geocodes?.main?.latitude;
                const sLon = item.geocodes?.main?.longitude;
                if (sLat && sLon) {
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${sLat},${sLon}`;
                  Linking.openURL(url);
                } else {
                  Alert.alert('No coordinates available for navigation');
                }
              }}
            >
              <Text style={styles.navigateButtonText}>Navigate</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          !loading && (
            <Text style={styles.emptyText}>No recommendations available.</Text>
          )
        }
      />
    </View>
  );
}

const PURPLE = '#5046b9';

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, paddingTop: 40, backgroundColor: '#f5f7fa' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: PURPLE, textAlign: 'center' },
  modeButtons: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  modeButton: {
    backgroundColor: PURPLE,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginHorizontal: 12,
    elevation: 2,
  },
  modeButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  fuelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  fuelLevelText: { fontWeight: 'bold', fontSize: 18, color: PURPLE },
  smallButton: {
    backgroundColor: '#edeafc',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  smallButtonText: { color: PURPLE, fontWeight: 'bold', fontSize: 15 },
  manualInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: PURPLE,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  setButton: {
    backgroundColor: PURPLE,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  setButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  alertBox: {
    backgroundColor: '#e17055',
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
    alignItems: 'center',
  },
  alertText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  errorText: { color: '#d63031', marginVertical: 14, fontWeight: 'bold', textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#edeafc',
  },
  bestCard: {
    borderColor: PURPLE,
    borderWidth: 2,
    backgroundColor: '#edeafc',
  },
  stationName: { fontWeight: 'bold', fontSize: 20, color: PURPLE, marginBottom: 4 },
  stationAddress: { color: '#636e72', marginBottom: 4 },
  stationInfo: { color: '#636e72', fontSize: 15, marginBottom: 2 },
  navigateButton: {
    backgroundColor: PURPLE,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  navigateButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  emptyText: { textAlign: 'center', color: PURPLE, marginTop: 32, fontSize: 16 },
});
