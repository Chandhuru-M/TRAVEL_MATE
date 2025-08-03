import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, sizes } from '../../constants';

// Define the shape of the place data this component expects
interface Place {
  id: string;
  name: string;
  category: string;
  rating: number;
  distance: number; // in miles
  price?: string; // e.g., '$$', '$120/night', '$3.45/gal'
  image: string;
}

interface PlaceCardProps {
  place: Place;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place }) => {
  const handleViewDetails = () => {
    Alert.alert("View Details", `Navigating to details for ${place.name}.`);
    // In a real app: router.push(`/places/${place.id}`);
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'restaurant':
        return 'restaurant';
      case 'hotel':
        return 'bed';
      case 'gas':
        return 'speedometer';
      case 'attraction':
        return 'camera';
      default:
        return 'location';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handleViewDetails}>
      {/* Image Section */}
      <Image source={{ uri: place.image }} style={styles.image} />

      {/* Info Section */}
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>{place.name}</Text>

        <View style={styles.categoryContainer}>
          <Ionicons name={getCategoryIcon(place.category)} size={14} color={Colors.textSecondary} />
          <Text style={styles.category}>{place.category}</Text>
        </View>

        <View style={styles.detailsContainer}>
          {/* Rating */}
          <View style={styles.detailItem}>
            <Ionicons name="star" size={16} color={Colors.accent} />
            <Text style={styles.detailText}>{place.rating.toFixed(1)}</Text>
          </View>

          {/* Distance */}
          <View style={styles.detailItem}>
            <Ionicons name="walk" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{place.distance.toFixed(1)} mi</Text>
          </View>

          {/* Price (optional) */}
          {place.price && (
            <View style={styles.detailItem}>
              <Ionicons name="cash" size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{place.price}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Chevron Icon */}
      <View style={styles.chevronContainer}>
        <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: sizes.borderRadius.lg,
    padding: sizes.spacing.md,
    marginBottom: sizes.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    alignItems: 'center',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: sizes.borderRadius.md,
    backgroundColor: Colors.lightGray,
  },
  infoContainer: {
    flex: 1,
    marginLeft: sizes.spacing.md,
    justifyContent: 'center',
  },
  name: {
    fontSize: sizes.font.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: sizes.spacing.xs,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: sizes.spacing.sm,
  },
  category: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: sizes.spacing.xs,
    textTransform: 'capitalize',
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap', // Allows details to wrap on smaller screens
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: sizes.spacing.md,
    marginTop: sizes.spacing.xs,
  },
  detailText: {
    marginLeft: sizes.spacing.xs,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: sizes.spacing.sm,
  },
});

export default PlaceCard;