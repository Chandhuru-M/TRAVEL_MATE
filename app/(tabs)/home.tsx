// app/(tabs)/home.tsx
import React from 'react';
import { StyleSheet, FlatList, SafeAreaView, View, Text, TouchableOpacity } from 'react-native';
import PlaceCard from '@/components/PlaceCard';
import CustomHeader from '@/components/CustomHeader';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { useTripStore } from '@/services/tripService'; // Import our store
import { mockPlaces } from '@/lib/mock-data';
import { router } from 'expo-router';

// A new component for the contextual banner
const ActiveTripBanner = () => {
  const { theme } = useTheme();
  const activeTrip = useTripStore((state) => state.getActiveTripPlan());

  if (!activeTrip) {
    return (
      <View style={[styles.banner, { backgroundColor: colors.card[theme] }]}>
        <Text style={{ color: colors.textMuted[theme] }}>Showing general recommendations. </Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/trip-planner' as any)}>
          <Text style={{ color: colors.primary[theme], fontWeight: 'bold' }}>Select a Trip</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.banner, { backgroundColor: colors.card[theme] }]}>
      <Text style={{ color: colors.textMuted[theme] }}>Active Trip: </Text>
      <Text style={{ color: colors.text[theme], fontWeight: 'bold' }}>{activeTrip.name}</Text>
    </View>
  );
};

export default function HomeScreen() {
  const { theme } = useTheme();
  // In a real app, you would use the activeTrip to filter API results
  // const activeTrip = useTripStore((state) => state.getActiveTripPlan());

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background[theme] }}>
      <CustomHeader />
      <ActiveTripBanner />
      <FlatList
        data={mockPlaces}
        renderItem={({ item }) => <PlaceCard place={item} />}
        keyExtractor={(item) => item.fsq_id}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingTop: 8 },
  banner: {
    flexDirection: 'row',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});