// app/(tabs)/home.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import PlaceCard from '@/components/PlaceCard';
import CustomHeader from '@/components/CustomHeader';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { fetchPlaces } from '@/lib/foursquare';
import { Place } from '@/lib/types';
import * as Location from 'expo-location';

const CategoryCarousel = ({ title, places }: { title: string; places: Place[] }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.carouselContainer}>
      <Text style={[styles.carouselTitle, { color: colors.text[theme] }]}>{title}</Text>
      <FlatList
        data={places}
        renderItem={({ item }) => <PlaceCard place={item} style={styles.carouselItem} />}
        // --- THIS IS THE DEFINITIVE FIX ---
        // Create a "composite key" that is guaranteed to be unique.
        // It combines the item's ID with its index in the list.
        keyExtractor={(item, index) => `${item.fsq_id}-${index}`}
        // ------------------------------------
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 16 }}
      />
    </View>
  );
};

export default function HomeScreen() {
  const { theme } = useTheme();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLocationAndPlaces = async () => {
      try {
        setLoading(true);
        setError(null);
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied.');
          setLoading(false);
          return;
        }
        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        const fetchedPlaces = await fetchPlaces({ lat: latitude, lon: longitude });
        setPlaces(fetchedPlaces);
      } catch (e) {
        setError("Failed to load places.");
      } finally {
        setLoading(false);
      }
    };
    loadLocationAndPlaces();
  }, []);

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

          {loading && <ActivityIndicator size="large" color={colors.primary[theme]} style={{ marginTop: 50 }} />}
          {error && <Text style={styles.errorText}>{error}</Text>}
          
          {!loading && !error && (
            <>
              <CategoryCarousel title="Popular Near You" places={places} />
              <CategoryCarousel title="Top-Rated Restaurants" places={reversedPlaces} />
            </>
          )}

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
  searchSection: { padding: 16 },
  welcomeTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 16, height: 50 },
  searchInput: { marginLeft: 12, fontSize: 16, flex: 1 },
  carouselContainer: { marginBottom: 24 },
  carouselTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, paddingHorizontal: 16 },
  carouselItem: { width: 280, marginRight: 16 },
  ctaCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, padding: 20, borderRadius: 12, marginTop: 16 },
  ctaTextContainer: { flex: 1, marginLeft: 16 },
  ctaTitle: { fontSize: 18, fontWeight: 'bold' },
  ctaSubtitle: { fontSize: 14, marginTop: 4 },
  errorText: { color: '#ef4444', textAlign: 'center', marginVertical: 50, fontSize: 16, paddingHorizontal: 16 },
});