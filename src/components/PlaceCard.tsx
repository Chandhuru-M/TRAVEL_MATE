// src/components/PlaceCard.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Place } from '@/lib/types';
import { FontAwesome, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface PlaceCardProps {
  place: Place;
}

const PlaceCard = ({ place }: PlaceCardProps) => {
  const priceDisplay = place.price ? '$'.repeat(place.price) : null;
  const distance = place.distance ? `${(place.distance / 1000).toFixed(1)}km` : null;

  const handleNavigate = () => {
    const lat = place.geocodes?.main?.lat;
    const lng = place.geocodes?.main?.lng;
    if (lat && lng) {
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['#E0E7FF', '#C7D2FE']}
        style={styles.imagePlaceholder}
      />

      <View style={styles.content}>
        <Text style={styles.title}>{place.name}</Text>
        <View style={styles.locationContainer}>
          <Feather name="map-pin" size={14} color="#6b7280" />
          <Text style={styles.address} numberOfLines={1}>
            {place.location?.formatted_address}
          </Text>
        </View>

        <View style={styles.badgeContainer}>
          {/* --- THIS IS THE FIX --- */}
          {place.categories.slice(0, 2).map((category: { name: string }) => (
            <View key={category.name} style={styles.badge}>
              <Text style={styles.badgeText}>{category.name}</Text>
            </View>
          ))}
          {/* ---------------------- */}
        </View>

        <View style={styles.detailsContainer}>
          {place.rating && (
            <View style={styles.detailItem}>
              <FontAwesome name="star" size={16} color="#f59e0b" />
              <Text style={styles.detailText}>{(place.rating / 2).toFixed(1)}</Text>
            </View>
          )}
          {distance && <Text style={styles.distanceText}>{distance}</Text>}
          {priceDisplay && (
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>{priceDisplay}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleNavigate}>
          <Feather name="external-link" size={16} color="#3b82f6" />
          <Text style={styles.buttonText}>Navigate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- STYLES (No changes needed here) ---
const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginVertical: 8,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      imagePlaceholder: {
        width: '100%',
        height: 120,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
      },
      content: {
        padding: 12,
      },
      title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#111827',
      },
      locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
      },
      address: {
        fontSize: 14,
        color: '#6b7280',
        marginLeft: 4,
        flexShrink: 1,
      },
      badgeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
      },
      badge: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
      },
      badgeText: {
        fontSize: 12,
        color: '#4b5563',
        fontWeight: '500',
      },
      detailsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      },
      detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      },
      detailText: {
        fontSize: 14,
        fontWeight: '500',
      },
      distanceText: {
        fontSize: 14,
        color: '#6b7280',
      },
      priceBadge: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
      },
      priceText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151',
      },
      button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
      },
      buttonText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
        color: '#3b82f6',
      },
});

export default PlaceCard;