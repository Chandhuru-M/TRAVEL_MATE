import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, sizes } from '../../constants';

interface QuickSuggestionButtonsProps {
  suggestions: string[];
  onPress: (suggestion: string) => void;
}

const QuickSuggestionButtons: React.FC<QuickSuggestionButtonsProps> = ({ suggestions, onPress }) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={styles.button}
            onPress={() => onPress(suggestion)}
          >
            <Text style={styles.buttonText}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: sizes.spacing.sm,
  },
  scrollContainer: {
    paddingHorizontal: sizes.spacing.md,
  },
  button: {
    backgroundColor: Colors.white,
    paddingVertical: sizes.spacing.sm,
    paddingHorizontal: sizes.spacing.md,
    borderRadius: sizes.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: sizes.spacing.sm,
  },
  buttonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default QuickSuggestionButtons;```

---

### 4. `components/chat/HotelOptionCard.tsx`

This is a specialized "rich content" card that can be rendered directly in the chat feed. It provides a much better user experience for booking suggestions than plain text.

```tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, sizes } from '../../constants';

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
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: hotel.image || `https://source.unsplash.com/400x300/?hotel,lobby&sig=${Math.random()}` }}
        style={styles.image}
      />
      <View style={styles.infoContainer}>
        <Text style={styles.hotelName}>{hotel.name}</Text>
        <View style={styles.detailsRow}>
          <Text style={styles.price}>${hotel.price}/night</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color={Colors.accent} />
            <Text style={styles.ratingText}>{hotel.rating.toFixed(1)}</Text>
          </View>
        </View>
      </View>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
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
    marginHorizontal: sizes.spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 120,
  },
  infoContainer: {
    padding: sizes.spacing.md,
  },
  hotelName: {
    fontSize: sizes.font.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: sizes.spacing.xs,
  },
  price: {
    fontSize: sizes.font.md,
    color: Colors.primary,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.accent}20`, // Light yellow background
    paddingHorizontal: sizes.spacing.sm,
    paddingVertical: sizes.spacing.xs,
    borderRadius: sizes.borderRadius.full,
  },
  ratingText: {
    marginLeft: sizes.spacing.xs,
    color: Colors.accent,
    fontWeight: 'bold',
  },
  actionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flex: 1,
    padding: sizes.spacing.md,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  actionButtonText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  primaryButtonText: {
    color: Colors.white,
  },
});

export default HotelOptionCard;