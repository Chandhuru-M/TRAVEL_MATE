import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Colors, sizes } from '../../constants';

// ---- DUMMY DATA (Replace with real data from your contexts/hooks) ----
const MY_LOCATION = { latitude: 37.78825, longitude: -122.4324 };
const FRIEND_LOCATIONS = [
  { id: 'f1', name: 'Alice', latitude: 37.785834, longitude: -122.406417 },
  { id: 'f2', name: 'Bob', latitude: 37.791334, longitude: -122.426417 },
];
const CRIME_ZONES = [
  { id: 'c1', latitude: 37.783834, longitude: -122.416417 },
];

// ---- MAIN SCREEN COMPONENT ----

const MapScreen = () => {
  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE} // Use Google Maps
        style={styles.map}
        initialRegion={{
          ...MY_LOCATION,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        // You can add a custom map style from Google Cloud for a unique look
      >
        {/* My Location Marker */}
        <Marker coordinate={MY_LOCATION} title="My Location">
          <View style={styles.myLocationMarker} />
        </Marker>

        {/* Friend Location Markers */}
        {FRIEND_LOCATIONS.map(friend => (
          <Marker key={friend.id} coordinate={friend} title={friend.name}>
            <View style={styles.friendMarker}>
              <Text style={styles.friendInitial}>{friend.name.charAt(0)}</Text>
            </View>
          </Marker>
        ))}

        {/* Crime Zone Markers */}
        {CRIME_ZONES.map(zone => (
          <Marker key={zone.id} coordinate={zone} title="High Crime Area">
            <View style={styles.crimeMarker}>
              <Ionicons name="warning" size={18} color={Colors.white} />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Map Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="navigate" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="locate" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Group Status Overlay */}
      <View style={styles.groupStatusContainer}>
        <Text style={styles.groupStatusTitle}>Group Status</Text>
        {FRIEND_LOCATIONS.map(friend => (
          <Text key={friend.id} style={styles.groupStatusText}>{friend.name} - Online</Text>
        ))}
      </View>
    </View>
  );
};

// ---- STYLES ----

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  myLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  friendMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  friendInitial: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  crimeMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 120, // Position above the tab bar
    right: sizes.spacing.md,
    flexDirection: 'column',
  },
  controlButton: {
    backgroundColor: Colors.white,
    padding: sizes.spacing.md,
    borderRadius: sizes.borderRadius.full,
    marginBottom: sizes.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  groupStatusContainer: {
    position: 'absolute',
    top: 60, // Position below the status bar
    left: sizes.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: sizes.spacing.md,
    borderRadius: sizes.borderRadius.md,
  },
  groupStatusTitle: {
    fontWeight: 'bold',
    marginBottom: sizes.spacing.xs,
  },
  groupStatusText: {
    color: Colors.textSecondary,
  },
});

export default MapScreen;