import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, sizes } from '@/constants';

// --- Components (can be moved to their own files later) ---
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

// --- Main Screen ---
const ExploreScreen = () => {
    // Dummy data for styling
    const DUMMY_PLACES = [
      { id: '1', name: 'The Garden Bistro', category: 'Restaurant', rating: 4.5, distance: 0.2, price: '$$', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4' },
      { id: '2', name: 'Grand Plaza Hotel', category: 'Hotel', rating: 4.2, distance: 0.5, price: '$120/night', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945' },
      { id: '3', name: 'Shell Gas Station', category: 'Gas', rating: 4.0, distance: 0.3, price: '$3.45/gal', image: 'https://images.unsplash.com/photo-1609171784829-92e1b1e4a3a5' },
      { id: '4', name: 'City Museum', category: 'Attraction', rating: 4.8, distance: 1.2, price: '$25', image: 'https://images.unsplash.com/photo-1582138404203-524554f6a8e7' },
      { id: '5', name: 'Another Cafe', category: 'Restaurant', rating: 4.3, distance: 1.5, price: '$', image: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8' },
    ];
    const [places, setPlaces] = useState(DUMMY_PLACES);
    const [loading, setLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');
    const filters = ['All', 'Restaurants', 'Hotels', 'Gas', 'Attractions'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Explore Nearby</Text>
        <Text style={styles.subtitle}>Find the best places around you</Text>

        <View style={{ height: 70 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
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

        {loading ? (
          <ActivityIndicator size="large" color={Colors.light.primary} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={places}
            renderItem={({ item }) => <PlaceCard place={item} />}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            // THE FIX IS HERE: We add padding to the bottom of the content.
            // This pushes the last item up so it's not hidden by the tab bar.
            contentContainerStyle={{ paddingBottom: 120 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

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
      marginBottom: sizes.spacing.xs,
    },
    filterContainer: {
      paddingVertical: sizes.spacing.md,
    },
    filterButton: {
      paddingVertical: sizes.spacing.sm,
      paddingHorizontal: sizes.spacing.lg,
      marginRight: sizes.spacing.sm,
      backgroundColor: Colors.light.cardBackground,
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
      color: Colors.light.cardBackground,
    },
    placeCard: {
      flexDirection: 'row',
      alignItems: 'center',
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
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingLeft: sizes.spacing.sm,
    },
    placePrice: {
        fontSize: sizes.font.md,
        fontWeight: 'bold',
        color: Colors.light.primary,
    }
  });

export default ExploreScreen;