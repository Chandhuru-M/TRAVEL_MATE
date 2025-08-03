import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, sizes } from '../../constants';

// Define the shape of the hotel data this component expects
interface Hotel {
  name: string;
  price: number;
  rating: number;
  image?: string; // Optional image URL
}

interface HotelOptionCardProps {
  hotel: Hotel;
}

const HotelOptionCard: React.FC<HotelOptionCardProps> = ({ hotel }) => {
  // Fallback image in case one isn't provided.
  // The random signature helps prevent caching the same image from unsplash.
  const imageUrl = hotel.image || `https://source.unsplash.com/400x300/?hotel,modern&sig=${Math.random()}`;

  const handleViewDetails = () => {
    Alert.alert("View Details", `Showing details for ${hotel.name}.`);
    // In a real app, you would navigate to a detailed hotel screen:
    // router.push(`/hotels/${hotel.id}`);
  };

  const handleBookNow = () => {
    Alert.alert("Book Now", `Proceeding to book ${hotel.name} for $${hotel.price}/night.`);
    // In a real app, this would initiate the booking flow.
  };

  return (
    <View style={styles.card}>
      {/* Hotel Image */}
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
      />

      {/* Hotel Information Section */}
      <View style={styles.infoContainer}>
        <Text style={styles.hotelName} numberOfLines={1}>{hotel.name}</Text>
        <View style={styles.detailsRow}>
          <Text style={styles.price}>${hotel.price.toFixed(2)}<Text style={styles.pricePerNight}>/night</Text></Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color={'#FFC700'} />
            <Text style={styles.ratingText}>{hotel.rating.toFixed(1)}</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons Section */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={handleViewDetails}>
          <Text style={styles.actionButtonText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.primaryButton]} onPress={handleBookNow}>
          <Text style={[styles.actionButtonText, styles.primaryButtonText]}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: sizes.borderRadius.lg,
    marginVertical: sizes.spacing.sm,
    // This card is meant to be used within a FlatList, so horizontal margin is handled by the list's contentContainerStyle
    overflow: 'hidden', // Ensures the image corners are rounded
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.lightGray, // Placeholder color while image loads
  },
  infoContainer: {
    padding: sizes.spacing.md,
  },
  hotelName: {
    fontSize: sizes.font.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: sizes.spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: sizes.font.lg,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  pricePerNight: {
    fontSize: sizes.font.sm,
    color: Colors.textSecondary,
    fontWeight: 'normal',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB', // A very light yellow
    paddingHorizontal: sizes.spacing.sm,
    paddingVertical: sizes.spacing.xs,
    borderRadius: sizes.borderRadius.full,
  },
  ratingText: {
    marginLeft: sizes.spacing.xs,
    color: '#B45309', // A darker yellow/brown for text
    fontWeight: 'bold',
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flex: 1,
    padding: sizes.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  actionButtonText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  primaryButtonText: {
    color: Colors.white,
  },
});

export default HotelOptionCard;