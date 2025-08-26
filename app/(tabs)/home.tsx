// app/(tabs)/home.tsx
import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, FlatList, TextInput, TouchableOpacity } from 'react-native';
import PlaceCard from '@/components/PlaceCard';
import CustomHeader from '@/components/CustomHeader';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { mockPlaces } from '@/lib/mock-data'; // 1. Import the mock data
import { Place } from '@/lib/types';
import { useTripStore } from '@/services/tripService';
import SelectActiveTripModal from '@/components/SelectActiveTripModal';

// Reusable component for horizontal carousels
const CategoryCarousel = ({ title, places }: { title: string; places: Place[] }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.carouselContainer}>
      <Text style={[styles.carouselTitle, { color: colors.text[theme] }]}>{title}</Text>
      <FlatList
        data={places}
        renderItem={({ item }) => <PlaceCard place={item} style={styles.carouselItem} />}
        keyExtractor={(item, index) => `${item.fsq_id}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 16 }}
      />
    </View>
  );
};

// Interactive banner for selecting the active trip
const ActiveTripBanner = () => {
  const { theme } = useTheme();
  const { tripPlans, activeTripPlanId, setActiveTripPlan } = useTripStore();
  const [modalVisible, setModalVisible] = useState(false);
  
  const activeTrip = tripPlans.find(p => p.id === activeTripPlanId);

  const handleSelect = (tripId: string | null) => {
    setActiveTripPlan(tripId);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity 
        onPress={() => setModalVisible(true)} 
        style={[styles.banner, { backgroundColor: colors.card[theme] }]}
      >
        <FontAwesome name="info-circle" size={20} color={colors.textMuted[theme]} style={{marginRight: 12}}/>
        <View style={{flex: 1}}>
          <Text style={{ color: colors.textMuted[theme] }}>
            {activeTrip ? 'Active Trip: ' : 'Showing general recommendations.'}
          </Text>
          <Text style={{ color: activeTrip ? colors.text[theme] : colors.primary[theme], fontWeight: 'bold' }}>
            {activeTrip ? activeTrip.name : 'Select a Trip'}
          </Text>
        </View>
        <FontAwesome name="exchange" size={20} color={colors.textMuted[theme]} />
      </TouchableOpacity>
      <SelectActiveTripModal
        isVisible={modalVisible}
        trips={tripPlans}
        onClose={() => setModalVisible(false)}
        onSelect={handleSelect}
      />
    </>
  );
};

export default function HomeScreen() {
  const { theme } = useTheme();

  // 2. Directly use the imported mockPlaces. No loading, error, or useEffect needed.
  const places = mockPlaces;
  const reversedPlaces = useMemo(() => [...places].reverse(), [places]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background[theme] }}>
      <CustomHeader />
      <ScrollView>
        <View style={styles.container}>
          <View style={styles.searchSection}>
            <Text style={[styles.welcomeTitle, { color: colors.text[theme] }]}>Where to, today?</Text>
            <View style={[styles.searchBar, { backgroundColor: colors.card[theme] }]}>
              <FontAwesome name="search" size={20} color={colors.textMuted[theme]} />
              <TextInput
                placeholder="Search for a destination..."
                placeholderTextColor={colors.textMuted[theme]}
                style={[styles.searchInput, { color: colors.text[theme] }]}
              />
            </View>
          </View>

          <ActiveTripBanner />

          {/* 3. Render the carousels directly with the mock data */}
          <CategoryCarousel title="Popular Near You" places={places} />
          <CategoryCarousel title="Top-Rated Restaurants" places={reversedPlaces} />

          <TouchableOpacity onPress={() => router.push('/(tabs)/trip-planner' as any)}>
            <View style={[styles.ctaCard, { backgroundColor: colors.card[theme] }]}>
              <FontAwesome name="suitcase" size={32} color={colors.primary[theme]} />
              <View style={styles.ctaTextContainer}>
                <Text style={[styles.ctaTitle, { color: colors.text[theme] }]}>Plan Your Next Adventure</Text>
                <Text style={[styles.ctaSubtitle, { color: colors.textMuted[theme] }]}>Create a new itinerary</Text>
              </View>
              <FontAwesome name="arrow-right" size={20} color={colors.textMuted[theme]} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 24 },
  searchSection: { paddingHorizontal: 16, paddingTop: 16 },
  welcomeTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 16, height: 50 },
  searchInput: { marginLeft: 12, fontSize: 16, flex: 1 },
  banner: {
    flexDirection: 'row',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  carouselContainer: { marginTop: 8, marginBottom: 24 },
  carouselTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, paddingHorizontal: 16 },
  carouselItem: { width: 280, marginRight: 16 },
  ctaCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, padding: 20, borderRadius: 12, marginTop: 16 },
  ctaTextContainer: { flex: 1, marginLeft: 16 },
  ctaTitle: { fontSize: 18, fontWeight: 'bold' },
  ctaSubtitle: { fontSize: 14, marginTop: 4 },
});