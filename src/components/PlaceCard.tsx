// src/components/PlaceCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, Alert } from 'react-native';
import { Place } from '@/lib/types';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { fetchPlaceDetails } from '@/lib/foursquare';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { useTripStore } from '@/services/tripService';

interface PlaceCardProps {
  place: Place;
  style?: ViewStyle;
}

export default function PlaceCard({ place, style }: PlaceCardProps) {
  const { theme } = useTheme();
  const { activeTripPlanId, savePlaceToTrip } = useTripStore.getState();

  const handlePress = () => {
    const id = (place as any).fsq_id || (place as any).id || null;
    if (!id) {
      console.warn('[PlaceCard] missing place id, cannot navigate', place);
      Alert.alert('Details unavailable', 'This place does not have an identifier to show details.');
      return;
    }

    // Try to pass the place object to the details page so it can render immediately
    try {
      const serialized = encodeURIComponent(JSON.stringify(place));
      router.push(`/place/${id}?place=${serialized}` as any);
    } catch (e) {
      // Fallback: navigate with id only
      router.push(`/place/${id}` as any);
    }
  };

  const handleSave = async () => {
    if (!activeTripPlanId) {
      Alert.alert(
        "No Active Trip",
        "Please select an active trip from the Trip Planner tab before saving places.",
        [{ text: "OK", onPress: () => router.push('/(tabs)/trip-planner' as any) }]
      );
      return;
    }

    const result = await savePlaceToTrip(activeTripPlanId, place);
    if (result.success) {
      Alert.alert("Place Saved!", `"${place.name}" has been added to your active trip.`);
    } else {
      Alert.alert("Error", result.error || "Could not save the place.");
    }
  };

  const handlePin = async () => {
    // navigate to map and instruct SoloMapView to show directions
    try {
      const lat = (place as any).latitude ?? (place.location as any)?.lat ?? (place.location as any)?.latitude ?? (place as any).lat ?? null;
      const lon = (place as any).longitude ?? (place.location as any)?.lon ?? (place.location as any)?.longitude ?? (place as any).lon ?? null;

      let finalLat = lat;
      let finalLon = lon;

      // If no coords but we have a fsq_id, try fetching details from Foursquare
      if ((!finalLat || !finalLon) && (place as any).fsq_id) {
        try {
          const details = await fetchPlaceDetails((place as any).fsq_id);
          const res = details?.result || details || {};
          finalLat = finalLat || (res?.geocodes?.main?.latitude) || (res?.location?.latitude) || finalLat;
          finalLon = finalLon || (res?.geocodes?.main?.longitude) || (res?.location?.longitude) || finalLon;
        } catch (e) {
          console.warn('fetchPlaceDetails failed', e);
        }
      }

      if (finalLat && finalLon) {
        const payload = encodeURIComponent(JSON.stringify({ latitude: finalLat, longitude: finalLon, name: place.name }));
        router.push(`/map?solo=${payload}` as any);
        return;
      }

      // Fallback: send address (SoloMapView will geocode it)
      const addr = (place as any).location?.formatted_address || (place as any).location?.address || place.name;
      if (!addr) { Alert.alert('Location unavailable', 'This place does not have coordinates or an address to navigate to.'); return; }
      const payload2 = encodeURIComponent(JSON.stringify({ address: addr, name: place.name }));
      router.push(`/map?solo=${payload2}` as any);
    } catch (e) {
      console.warn('pin navigation failed', e);
      Alert.alert('Unable to open map');
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card[theme] }, style]}>
      <TouchableOpacity onPress={handlePress}>
        <LinearGradient colors={['#E0E7FF', '#C7D2FE']} style={styles.imagePlaceholder} />
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text[theme] }]} numberOfLines={1}>{place.name}</Text>
          <View style={styles.locationContainer}>
            <FontAwesome name="map-pin" size={14} color={colors.textMuted[theme]} />
            <Text style={[styles.address, { color: colors.textMuted[theme] }]} numberOfLines={1}>{place.location?.formatted_address}</Text>
          </View>
        </View>
      </TouchableOpacity>
      {/* --- SAVE BUTTON --- */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <FontAwesome name="bookmark" size={20} color={'white'} />
      </TouchableOpacity>
      {/* --- PIN / DIRECTIONS BUTTON --- */}
      <TouchableOpacity style={styles.pinButton} onPress={handlePin}>
        <FontAwesome name="map-pin" size={18} color={'white'} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
    card: { borderRadius: 12, marginVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    imagePlaceholder: { width: '100%', height: 120, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
    content: { padding: 12 },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    locationContainer: { flexDirection: 'row', alignItems: 'center' },
    address: { fontSize: 14, marginLeft: 6, flexShrink: 1 },
    saveButton: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: 8,
      borderRadius: 20,
    },
    pinButton: {
      position: 'absolute',
      top: 12,
      right: 52,
      backgroundColor: 'rgba(0, 122, 255, 0.9)',
      padding: 8,
      borderRadius: 20,
    },
});