// app/(tabs)/home.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, FlatList, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PlaceCard from '@/components/PlaceCard';
import CustomHeader from '@/components/CustomHeader';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { fetchPlaces, fetchPlacesNearby, getDeviceLocation, fetchPlaceDetails } from '@/lib/foursquare';
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
        renderItem={({ item }) => <PlaceCard place={item} style={styles.carouselItem} compact />}
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
  const [weather, setWeather] = useState<{ temp?: number; wind?: number; code?: number; summary?: string } | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [restaurants, setRestaurants] = useState<Place[]>([]);
  const [hotels, setHotels] = useState<Place[]>([]);
  const [categoryPlaces, setCategoryPlaces] = useState<Record<string, Place[]>>({});
  const CATEGORY_DEFS = [
    { key: 'attractions', title: 'Attractions' },
    { key: 'restaurants', title: 'Top-Rated Restaurants' },
    { key: 'cafes', title: 'Cafes' },
    { key: 'bars', title: 'Bars & Nightlife' },
    { key: 'shopping', title: 'Shopping' },
  { key: 'parks', title: 'Parks & Outdoors' },
  { key: 'petrol', title: 'Petrol Stations' },
  { key: 'banks', title: 'Banks & ATMs' },
  { key: 'museums', title: 'Museums & Galleries' },
  { key: 'hospitals', title: 'Hospitals' },
  { key: 'pharmacy', title: 'Pharmacies' },
  { key: 'textiles', title: 'Textiles & Fabrics' },
  ];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const HOTELS_KEY = 'hotels_cache_v1';
  const [searchText, setSearchText] = useState<string>('');
  const [searchActive, setSearchActive] = useState<boolean>(false);

  // This useEffect hook now handles location permissions and fetches live data
  useEffect(() => {
    const HOTELS_KEY = 'hotels_cache_v1';

    const loadCachedHotels = async () => {
      try {
        const raw = await AsyncStorage.getItem(HOTELS_KEY);
        if (raw) {
          const parsed: Place[] = JSON.parse(raw);
          // Normalize cached items so they always have an identifier field
          const normalized = parsed.map((it: any) => ({
            ...it,
            fsq_id: it.fsq_id || it.fsq_place_id || it.id,
          }));
          setHotels(normalized);
        }
      } catch (e) {
        console.warn('Failed to load cached hotels:', e);
      }
    };

    const cacheHotels = async (items: Place[]) => {
      try {
  const normalized = (items || []).map((it: any) => ({ ...it, fsq_id: it.fsq_id || it.fsq_place_id || it.id }));
  await AsyncStorage.setItem(HOTELS_KEY, JSON.stringify(normalized));
      } catch (e) {
        console.warn('Failed to cache hotels:', e);
      }
    };

    const tryFetchWithFallback = async (latitude: number, longitude: number, initialQuery: string) => {
      // try increasing radius and fallback queries
      const radii = [5000, 10000, 20000];
      const fallbackQueries = [initialQuery, 'popular places', 'food'];

      for (const q of fallbackQueries) {
        for (const r of radii) {
          try {
            const res = await fetchPlaces({ lat: latitude, lon: longitude, query: q, radius: r, limit: 20 });
            if (res && res.length > 0) return res;
          } catch (e) {
            console.warn('fetchPlaces attempt failed', q, r, e);
            // continue to next
          }
        }
      }
      return [] as Place[];
    };

    const loadLocationAndPlaces = async () => {
      setLoading(true);
      setError(null);

      try {
        // load cached hotels first so UI is not empty on reload
        await loadCachedHotels();

        // get coords
        const { latitude, longitude } = await getDeviceLocation();
        console.log('[Home] device coords', { latitude, longitude });

        // Fetch current weather from Open-Meteo (no API key required)
        (async () => {
          try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=celsius&windspeed_unit=kmh&timezone=auto`;
            const resp = await fetch(url);
            const json = await resp.json();
            const cw = json?.current_weather;
            if (cw) {
              const code = Number(cw.weathercode);
              const summary = (() => {
                switch (code) {
                  case 0: return 'Clear';
                  case 1: case 2: case 3: return 'Partly cloudy';
                  case 45: case 48: return 'Fog';
                  case 51: case 53: case 55: return 'Drizzle';
                  case 61: case 63: case 65: return 'Rain';
                  case 71: case 73: case 75: return 'Snow';
                  case 80: case 81: case 82: return 'Rain showers';
                  case 95: case 96: case 99: return 'Thunderstorm';
                  default: return 'Weather';
                }
              })();
              setWeather({ temp: cw.temperature, wind: cw.windspeed, code, summary });
            }
          } catch (e) {
            console.warn('Weather fetch failed', e);
          }
        })();

        // Per-category query lists
        const popularQueries = ['tourist attraction', 'point of interest', 'attraction', 'sight', 'things to do', 'popular places'];
        const restaurantQueries = ['restaurant', 'food', 'dining', 'cafe'];

        

        // Seven category definitions to display on Home
        const categoryDefs = [
          { key: 'attractions', title: 'Attractions', queries: ['tourist attraction', 'point of interest', 'attraction', 'sight', 'things to do'] },
          { key: 'restaurants', title: 'Top-Rated Restaurants', queries: ['restaurant', 'food', 'dining', 'cafe'] },
          { key: 'cafes', title: 'Cafes', queries: ['cafe', 'coffee', 'tea'] },
          { key: 'bars', title: 'Bars & Nightlife', queries: ['bar', 'pub', 'nightlife'] },
          { key: 'shopping', title: 'Shopping', queries: ['shopping', 'mall', 'market'] },
          { key: 'parks', title: 'Parks & Outdoors', queries: ['park', 'garden', 'outdoor'] },
          { key: 'petrol', title: 'Petrol Stations', queries: ['petrol station', 'gas station', 'fuel station', 'petrol'] },
          { key: 'banks', title: 'Banks & ATMs', queries: ['bank', 'atm', 'cash machine', 'bank branch'] },
          { key: 'museums', title: 'Museums & Galleries', queries: ['museum', 'gallery', 'exhibit'] },
          { key: 'hospitals', title: 'Hospitals', queries: ['hospital', 'medical center', 'clinic', 'healthcare'] },
          { key: 'pharmacy', title: 'Pharmacies', queries: ['pharmacy', 'chemist', 'drugstore', 'pharmacie'] },
          { key: 'textiles', title: 'Textiles & Fabrics', queries: ['textile', 'fabric store', 'fabrics', 'cloth shop'] },
        ];

        const fetchFirstMatch = async (queries: string[]) => {
          const radii = [5000, 10000, 20000];
          for (const q of queries) {
            for (const r of radii) {
              try {
                const res = await fetchPlaces({ lat: latitude, lon: longitude, query: q, radius: r, limit: 20 });
                if (res && res.length > 0) return res;
              } catch (e) {
                // continue
              }
            }
          }
          return [] as Place[];
        };

        // Fetch each category (limited detail lookups per category)
        const categoryResults = await Promise.all(categoryDefs.map(async (c) => {
          const raw = await fetchFirstMatch(c.queries);
          const normalized = (raw || []).map((it: any) => ({ ...it, fsq_id: it.fsq_id || it.fsq_place_id || it.id }));
          // Fetch the first photo for each place (parallel, but limit concurrency)
          const items = await Promise.all(normalized.slice(0, 8).map(async (place: any) => {
            if (!place.fsq_id) return place;
            try {
              const details = await fetchPlaceDetails(place.fsq_id);
              if (details && Array.isArray(details.photos) && details.photos.length > 0) {
                return { ...place, photos: details.photos };
              }
            } catch {}
            return place;
          }));
          return { key: c.key, title: c.title, items };
        }));

        const map: Record<string, Place[]> = {};
        for (const r of categoryResults) map[r.key] = r.items;
        setCategoryPlaces(map);

      } catch (locErr: any) {
        console.error('places fetch error:', locErr);
        setError(typeof locErr === 'string' ? locErr : locErr.message || 'Current location is unavailable.');
      } finally {
        setLoading(false);
      }
    };

    loadLocationAndPlaces();
  }, []); // The empty array ensures this runs only once when the screen mounts

  const reversedPlaces = useMemo(() => [...places].reverse(), [places]);
  const reversedRestaurants = useMemo(() => [...restaurants].reverse(), [restaurants]);

  const performSearch = async (query: string) => {
    if (!query || query.trim().length === 0) {
      return;
    }
    setSearchActive(true);
    setLoading(true);
    setError(null);
    try {
      const { latitude, longitude } = await getDeviceLocation();
      // try a few radii for robustness
      const fetched = await fetchPlacesNearby({ query, radius: 10000, limit: 20 });
      setPlaces(fetched);

      // If search is hotels or first result looks like hotel, cache as hotels
      if (query.toLowerCase().includes('hotel') || (fetched && fetched.length > 0 && fetched[0].categories?.some(c => c.name?.toLowerCase().includes('hotel')))) {
        setHotels(fetched);
        try {
          await AsyncStorage.setItem(HOTELS_KEY, JSON.stringify(fetched || []));
        } catch (e) {
          console.warn('Failed to cache hotels on search', e);
        }
      }

      // Only fetch restaurants if the user's query implies restaurants/food
      const qLower = query.toLowerCase();
      if (qLower.includes('restaurant') || qLower.includes('food') || qLower.includes('dining') || qLower.includes('eat') || qLower.includes('cafe')) {
        const fetchedRestaurants = await fetchPlacesNearby({ query: 'restaurant', radius: 10000, limit: 20 });
        setRestaurants(fetchedRestaurants);
      } else {
        // clear restaurants for unrelated queries (e.g., atm)
        setRestaurants([]);
      }
    } catch (e: any) {
      console.error('performSearch error', e);
      setError(typeof e === 'string' ? e : e?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  // Clear search mode when the input is cleared
  useEffect(() => {
    if (!searchText || searchText.trim().length === 0) {
      setSearchActive(false);
      setPlaces([]);
      setRestaurants([]);
    }
  }, [searchText]);

  const renderContent = () => {
    // When user performed a search, show search results first
    if (searchActive) {
      if (loading) return <ActivityIndicator size="large" color={colors.primary[theme]} style={{ marginTop: 24 }} />;
      if (error) return <Text style={styles.errorText}>{error}</Text>;
      if (places && places.length > 0) {
        return (
          <>
            <CategoryCarousel title={`Search results for "${searchText}"`} places={places} />
            {reversedRestaurants && reversedRestaurants.length > 0 && (
              <CategoryCarousel title="Top-Rated Restaurants" places={reversedRestaurants} />
            )}
          </>
        );
      }
      return <Text style={[styles.errorText, { color: colors.textMuted[theme] }]}>No results found for "{searchText}".</Text>;
    }

    if (loading) {
      return <ActivityIndicator size="large" color={colors.primary[theme]} style={{ marginTop: 24 }} />;
    }

    if (error) {
      return <Text style={styles.errorText}>{error}</Text>;
    }

    // If we have category data, render the category carousels in order
    if (Object.keys(categoryPlaces).length > 0) {
      return (
        <>
          {CATEGORY_DEFS.map(c => (
            <React.Fragment key={c.key}>
              {(categoryPlaces[c.key] || []).length > 0 && (
                <CategoryCarousel title={c.title} places={categoryPlaces[c.key]} />
              )}
            </React.Fragment>
          ))}
        </>
      );
    }

    // Fallback: older single lists
    if (places && places.length > 0) {
      return (
        <>
          <CategoryCarousel title="Popular Near You" places={places} />
          <CategoryCarousel title="Top-Rated Restaurants" places={reversedRestaurants} />
        </>
      );
    }

    return <Text style={[styles.errorText, { color: colors.textMuted[theme] }]}>No places found nearby.</Text>;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background[theme] }}>
  <CustomHeader showSettings={false} />
      {/* Keyboard aware wrapper so inputs remain visible when typing */}
  <KeyboardAvoidingView style={{ flex: 1 }} behavior={(Platform.OS as string) === 'ios' ? 'padding' : 'height'}>
        {/* Weather is rendered below the title as a compact single-line */}
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.container}>
          <View style={styles.searchSection}>
            <Text style={[styles.welcomeTitle, { color: colors.text[theme] }]}>Where to, today?</Text>
            {weather ? (
              <Text style={[styles.weatherLine, { color: colors.textMuted[theme] }]}>
                {weather.summary === 'Clear' ? '☀️' : weather.summary === 'Partly cloudy' ? '⛅' : weather.summary === 'Rain' || weather.summary?.includes('Rain') ? '🌧️' : weather.summary === 'Snow' ? '❄️' : '🌤️'}
                {'  '}{Math.round(weather.temp ?? 0)}°C • {weather.summary} • Wind {Math.round(weather.wind ?? 0)} km/h
              </Text>
            ) : null}
            <View style={[styles.searchBar, { backgroundColor: colors.card[theme] }]}>
              {searchActive ? (
                <TouchableOpacity onPress={() => { setSearchActive(false); setSearchText(''); setPlaces([]); setRestaurants([]); }}>
                  <FontAwesome name="arrow-left" size={20} color={colors.textMuted[theme]} />
                </TouchableOpacity>
              ) : (
                <FontAwesome name="search" size={20} color={colors.textMuted[theme]} />
              )}
              <TextInput
                placeholder="Search for a destination..."
                placeholderTextColor={colors.textMuted[theme]}
                style={[styles.searchInput, { color: colors.text[theme] }]}
                value={searchText}
                onChangeText={setSearchText}
                returnKeyType="search"
                onSubmitEditing={async () => {
                  // perform search when user presses enter on keyboard
                  await performSearch(searchText);
                }}
              />

              <TouchableOpacity
                onPress={async () => {
                  await performSearch(searchText);
                }}
                style={[styles.searchButton, { backgroundColor: colors.primary[theme] }]}
                accessibilityRole="button"
                accessibilityLabel="Search"
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Search</Text>
              </TouchableOpacity>
              {/* Cancel / Exit search button */}
              {searchActive && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchActive(false);
                    setSearchText('');
                    setPlaces([]);
                    setRestaurants([]);
                  }}
                  style={{ marginLeft: 8, paddingHorizontal: 10, paddingVertical: 8 }}
                >
                  <Text style={{ color: colors.textMuted[theme], fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Developer options removed - search is in the search bar */}

          <ActiveTripBanner />

          {renderContent()}

          <TouchableOpacity onPress={() => router.push('/fuel' as any)}>
            <View style={[styles.ctaCard, { backgroundColor: colors.card[theme] }]}>
              <FontAwesome name="tint" size={32} color={colors.primary[theme]} />
              <View style={styles.ctaTextContainer}>
                <Text style={[styles.ctaTitle, { color: colors.text[theme] }]}>Find Nearby Fuel</Text>
                <Text style={[styles.ctaSubtitle, { color: colors.textMuted[theme] }]}>Check for gas stations</Text>
              </View>
              <FontAwesome name="arrow-right" size={20} color={colors.textMuted[theme]} />
            </View>
          </TouchableOpacity>

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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 24 },
  searchSection: { paddingHorizontal: 16, paddingTop: 16 },
  welcomeTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
  weatherBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, marginHorizontal: 16, borderRadius: 12, marginBottom: 12 },
  weatherLine: { fontSize: 14, marginBottom: 12 },
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
  searchButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginLeft: 8, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#ef4444', textAlign: 'center', marginTop: 50, fontSize: 16, paddingHorizontal: 16 },
});