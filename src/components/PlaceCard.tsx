// src/components/PlaceCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Place } from '@/lib/types';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

interface PlaceCardProps {
  place: Place;
}

const PlaceCard = ({ place }: PlaceCardProps) => {
  const handlePress = () => {
    router.push(`/place/${place.fsq_id}` as any);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <LinearGradient colors={['#E0E7FF', '#C7D2FE']} style={styles.imagePlaceholder} />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{place.name}</Text>
        <View style={styles.locationContainer}>
          <FontAwesome name="map-pin" size={14} color="#94a3b8" />
          <Text style={styles.address} numberOfLines={1}>{place.location?.formatted_address}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Add professional styles
const styles = StyleSheet.create({
    card: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
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
        color: 'white',
        marginBottom: 4,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    address: {
        fontSize: 14,
        color: '#94a3b8',
        marginLeft: 6,
        flexShrink: 1,
    },
});

export default PlaceCard;