import { Colors, sizes } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Import your API hooks and location hooks here
// import { useLocation } from '../../hooks/useLocation';
// import { usePlaces } from '../../hooks/usePlaces';

// ---- DUMMY DATA & COMPONENTS (Replace with real ones) ----
const DUMMY_PLACES = [
  { id: '1', name: 'The Garden Bistro', category: 'Restaurant', rating: 4.5, distance: 0.2, price: '$$', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4' },
  { id: '2', name: 'Grand Plaza Hotel', category: 'Hotel', rating: 4.2, distance: 0.5, price: '$120/night', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945' },
  { id: '3', name: 'Shell Gas Station', category: 'Gas', rating: 4.0, distance: 0.3, price: '$3.45/gal', image: 'https://images.unsplash.com/photo-1609171784829-92e1b1e4a3a5' },
  { id: '4', name: 'City Museum', category: 'Attraction', rating: 4.8, distance: 1.2, price: '$25', image: 'https://images.unsplash.com/photo-1582138404203-524554f6a8e7' },
];

const PlaceCard = ({ place }: { place: any }) => (
  <TouchableOpacity style={styles.placeCard}>
    <Image source={{ uri: place.image }} style={styles.placeImage} />
    <View style={styles.placeInfo}>
      <Text style={styles.placeName}>{place.name}</Text>
      <Text style={styles.placeCategory}>{place.category}</Text>
      <View style={styles.placeDetails}>
        <Ionicons name="star" color={Colors.light.accent} size={16} />
        <Text style={styles.placeRating}>{place.rating}</Text>
        <Text style={styles.placeDistance}> • {place.distance} miles</Text>
      </View>
    </View>
    <View style={styles.placePriceContainer}>
      <Text style={styles.placePrice}>{place.price}</Text>
    </View>
  </TouchableOpacity>
);

// ---- MAIN SCREEN COMPONENT ----

type Place = {
  id: string;
  name: string;
  category: string;
  rating: number;
  distance: number;
  price: string;
  image: string;
};

const ExploreScreen = () => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'Restaurants', 'Hotels', 'Gas', 'Attractions'];

  // This would be replaced with your actual API call
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const filteredPlaces = activeFilter === 'All'
        ? DUMMY_PLACES
        : DUMMY_PLACES.filter(p => p.category === activeFilter);
      setPlaces(filteredPlaces);
      setLoading(false);
    }, 500); // Simulate network request
  }, [activeFilter]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Explore Nearby</Text>
        <Text style={styles.subtitle}>Find the best places around you</Text>

        {/* Filters */}
        <View style={{ height: 60 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            {filters.map(filter => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterButton, activeFilter === filter && styles.filterActiveButton]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[styles.filterText, activeFilter === filter && styles.filterActiveText]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Places List */}
        {loading ? (
          <ActivityIndicator size="large" color={Colors.light.primary} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={places}
            renderItem={({ item }) => <PlaceCard place={item} />}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={<Text style={styles.emptyText}>No places found for this category.</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

// ---- STYLES ----

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: sizes.spacing.md,
  },
  title: {
    fontSize: sizes.font.xxl,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginTop: sizes.spacing.md,
  },
  subtitle: {
    fontSize: sizes.font.md,
    color: Colors.light.textSecondary,
    marginBottom: sizes.spacing.lg,
  },
  filterContainer: {
    paddingVertical: sizes.spacing.md,
  },
  filterButton: {
    paddingVertical: sizes.spacing.sm,
    paddingHorizontal: sizes.spacing.lg,
    marginRight: sizes.spacing.sm,
    backgroundColor: '#F7F8FA',
    borderRadius: sizes.borderRadius.full,
  },
  filterActiveButton: {
    backgroundColor: Colors.light.primary,
  },
  filterText: {
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  filterActiveText: {
    color: '#fff',
  },
  placeCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: sizes.borderRadius.lg,
    padding: sizes.spacing.md,
    marginBottom: sizes.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  placeImage: {
    width: 80,
    height: 80,
    borderRadius: sizes.borderRadius.md,
  },
  placeInfo: {
    flex: 1,
    marginLeft: sizes.spacing.md,
    justifyContent: 'center',
  },
  placeName: {
    fontSize: sizes.font.lg,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  placeCategory: {
    fontSize: sizes.font.sm,
    color: Colors.light.textSecondary,
    marginBottom: sizes.spacing.sm,
  },
  placeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeRating: {
    marginLeft: sizes.spacing.xs,
    color: Colors.light.text,
    fontWeight: 'bold',
  },
  placeDistance: {
    color: Colors.light.textSecondary,
  },
  placePriceContainer: {
    justifyContent: 'flex-end',
  },
  placePrice: {
    fontSize: sizes.font.md,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: Colors.light.textSecondary,
  },
});

export default ExploreScreen;