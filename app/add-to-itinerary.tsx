// app/add-to-itinerary.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { useTripStore } from '@/services/tripService';
import { Place } from '@/lib/types';
import { router, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

const AddPlaceCard = ({ place, onAdd }: { place: Place; onAdd: () => void }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card[theme] }]}>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: colors.text[theme] }]}>{place.name}</Text>
        <Text style={[styles.cardSubtitle, { color: colors.textMuted[theme] }]} numberOfLines={1}>
          {place.location?.formatted_address}
        </Text>
      </View>
      <TouchableOpacity style={styles.addButton} onPress={onAdd}>
        <FontAwesome name="plus" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default function AddToItineraryScreen() {
  const { theme } = useTheme();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { tripPlans, moveSavedPlaceToItinerary } = useTripStore.getState();
  
  const trip = tripPlans.find(p => p.id === tripId);

  const handleAddPlace = (place: Place) => {
    Alert.prompt(
      `Add "${place.name}"`,
      "Enter the Day and Duration (in hours), separated by a comma (e.g., '1, 2.5').",
      async (text) => {
        if (!text) return;
        const [dayStr, durationStr] = text.split(',');

        if (!dayStr || !durationStr) {
          Alert.alert("Invalid Format", "Please use the format: Day, Duration (e.g., '1, 2.5')");
          return;
        }

        const day = parseInt(dayStr.trim());
        const durationInHours = parseFloat(durationStr.trim());

        if (isNaN(day) || isNaN(durationInHours) || day <= 0 || durationInHours <= 0) {
          Alert.alert("Invalid Input", "Please enter a valid day and duration.");
          return;
        }
        
        const durationInMinutes = durationInHours * 60;
        const result = await moveSavedPlaceToItinerary(trip!.id, day, place, durationInMinutes);

        if (result.success) {
          Alert.alert("Success!", `"${place.name}" has been added to your itinerary.`);
          router.back();
        } else {
          Alert.alert("Error", result.error || "Could not add place to itinerary.");
        }
      },
      'plain-text',
      '1, 2'
    );
  };

  if (!trip) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background[theme], justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text style={{ color: colors.text[theme], textAlign: 'center', marginTop: 20 }}>Loading trip details...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background[theme] }}>
      <FlatList
        data={trip.saved_places}
        renderItem={({ item }) => <AddPlaceCard place={item} onAdd={() => handleAddPlace(item)} />}
        keyExtractor={(item) => item.fsq_id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text[theme] }]}>Add to Itinerary</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted[theme] }]}>Select a place from your saved list to add it to your daily schedule.</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={{alignItems: 'center', padding: 20, marginTop: 40}}>
            <FontAwesome name="bookmark-o" size={50} color={colors.textMuted[theme]} />
            <Text style={{ color: colors.textMuted[theme], textAlign: 'center', marginTop: 16, fontSize: 16 }}>
              You have no saved places for this trip. Go to the Home screen to find and save places first.
            </Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  header: {
    marginBottom: 16,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardSubtitle: { fontSize: 14, marginTop: 4 },
  addButton: {
    backgroundColor: '#22c55e',
    padding: 12,
    borderRadius: 24,
    marginLeft: 12,
  },
});