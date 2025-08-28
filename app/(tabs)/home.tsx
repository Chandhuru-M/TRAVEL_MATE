// app/(tabs)/home.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import PlaceCard from '@/components/PlaceCard';
import CustomHeader from '@/components/CustomHeader';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { fetchPlaces, fetchPlacesNearby, getDeviceLocation } from '@/lib/foursquare'; // 1. Import the real API fetch functions
import { Place } from '@/lib/types';
// location is handled in the foursquare helper now
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
  const [places, setPlaces] = useState<Place[]>([]);
  const [restaurants, setRestaurants] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const testQueries = [
    'popular places',
    'restaurant',
    'cafe',
    'supermarket',
    'hotel',
    'petrol station',
    'pharmacy',
  ];
  const [selectedQuery, setSelectedQuery] = useState<string>(testQueries[0]);

  // This useEffect hook now handles location permissions and fetches live data
  useEffect(() => {
    const loadLocationAndPlaces = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simplify: use the centralized helper which requests permission and location
        try {
          // Get device coordinates explicitly
          const { latitude, longitude } = await getDeviceLocation();
          console.log('[Home] device coords', { latitude, longitude });

          // Fetch two separate queries and merge into state variables
          const popular = await fetchPlaces({ lat: latitude, lon: longitude, query: 'popular places', limit: 12 });
          const restaurants = await fetchPlaces({ lat: latitude, lon: longitude, query: 'restaurant', limit: 12 });

          // Prefer showing popular in the first carousel and restaurants in the second
          setPlaces(popular);
          // stash restaurants in a temporary state by attaching to a ref? Simpler: setPlaces to popular and
          // keep restaurants in a local variable to reverse for second carousel
          // We'll set a small local state for restaurants
          setRestaurants(restaurants);
        } catch (locErr: any) {
          console.error('places fetch error:', locErr);
          setError(typeof locErr === 'string' ? locErr : locErr.message || 'Current location is unavailable.');
          setLoading(false);
          return;
        }

      } catch (e) {
        setError("Failed to load places. Please check your connection and location services.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadLocationAndPlaces();
  }, []); // The empty array ensures this runs only once when the screen mounts

  const reversedPlaces = useMemo(() => [...places].reverse(), [places]);
  const reversedRestaurants = useMemo(() => [...restaurants].reverse(), [restaurants]);

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={colors.primary[theme]} style={{ marginTop: 50 }} />;
    }
    if (error) {
      return <Text style={styles.errorText}>{error}</Text>;
    }
    if (places.length === 0) {
        return <Text style={[styles.errorText, {color: colors.textMuted[theme]}]}>No places found nearby.</Text>
    }
    return (
      <>
        <CategoryCarousel title="Popular Near You" places={places} />
        <CategoryCarousel title="Top-Rated Restaurants" places={reversedRestaurants} />
      </>
    );
  };

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

          {__DEV__ && (
            <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
              <Text style={{ marginBottom: 8, color: colors.textMuted[theme] }}>Dev: pick a query</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {testQueries.map((q) => (
                  <TouchableOpacity
                    key={q}
                    onPress={() => setSelectedQuery(q)}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      borderRadius: 20,
                      marginRight: 8,
                      marginBottom: 8,
                      backgroundColor: selectedQuery === q ? colors.primary[theme] : colors.card[theme],
                    }}
                  >
                    <Text style={{ color: selectedQuery === q ? '#fff' : colors.text[theme] }}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={async () => {
                  console.log('[DevTest] Run pressed, selectedQuery=', selectedQuery);
                  Alert.alert('Dev Run', `Query: ${selectedQuery}`);
                  setLoading(true);
                  setError(null);
                  try {
                    const fetched = await fetchPlacesNearby({ query: selectedQuery, radius: 10000, limit: 20 });
                    console.log('[DevTest] fetched places count', fetched.length);
                    setPlaces(fetched);
                    const fetchedRestaurants = await fetchPlacesNearby({ query: 'restaurant', radius: 10000, limit: 20 });
                    setRestaurants(fetchedRestaurants);
                  } catch (e) {
                    console.error(e);
                    setError('Dev test fetch failed');
                  } finally {
                    setLoading(false);
                  }
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Run dev query"
                style={{ backgroundColor: colors.card[theme], padding: 10, borderRadius: 8, marginTop: 8 }}
              >
                <Text style={{ color: colors.primary[theme], textAlign: 'center', fontWeight: '600' }}>Run</Text>
              </TouchableOpacity>
            </View>
          )}

          <ActiveTripBanner />

          {renderContent()}

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
  errorText: { color: '#ef4444', textAlign: 'center', marginTop: 50, fontSize: 16, paddingHorizontal: 16 },
});