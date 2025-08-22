// app/(tabs)/map.tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { mockPlaces } from '@/lib/mock-data'; // Using alias path

export default function MapScreen() {
  return (
    <MapView
      style={styles.map}
      customMapStyle={mapStyle}
      initialRegion={{
        latitude: 48.8584, // Center on Paris for our mock data
        longitude: 2.2945,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
    >
      {/* --- THIS IS THE FIX --- */}
      {mockPlaces
        // 1. Filter out any places that don't have valid coordinates
        .filter(place => place.geocodes?.main?.lat && place.geocodes?.main?.lng)
        // 2. Now we can safely map over the filtered list
        .map(place => (
          <Marker
            key={place.fsq_id}
            coordinate={{
              // We can now access these safely because of the filter
              latitude: place.geocodes!.main!.lat,
              longitude: place.geocodes!.main!.lng,
            }}
            title={place.name}
            // Use optional chaining for the description, just in case
            description={place.location?.formatted_address}
          />
        ))}
      {/* ------------------------- */}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

// Standard JSON for a dark-themed map (no changes needed here)
const mapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
];