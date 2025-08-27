import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Place } from '@/lib/types';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { useTripStore } from '@/services/tripService'; // Import our store

export default function PlaceCard({ place }: { place: Place }) {
  const { theme } = useTheme();
  const { getActiveTripPlan, savePlaceToTrip } = useTripStore();

  const handlePress = () => {
    router.push(`/place/${place.fsq_id}` as any);
  };

  const handleSave = () => {
    const activeTrip = getActiveTripPlan();
    if (activeTrip) {
      const result = savePlaceToTrip(activeTrip.id, place);
      if (result.success) {
        Alert.alert("Place Saved", `Successfully saved "${place.name}" to your trip: "${activeTrip.name}".`);
      }
    } else {
      // This is the "ambiguous intent" flaw, solved.
      Alert.alert(
        "No Active Trip",
        "Please select an active trip from the Trip Planner tab before saving places."
      );
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card[theme] }]}>
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
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <FontAwesome name="bookmark" size={20} color={colors.primary[theme]} />
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
    saveButton: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20 },
});