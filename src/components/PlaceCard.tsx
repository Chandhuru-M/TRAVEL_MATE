// src/components/PlaceCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native'; // 1. Import ViewStyle
import { Place } from '@/lib/types';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';

// 2. Define the props to include an optional style
interface PlaceCardProps {
  place: Place;
  style?: ViewStyle;
}

export default function PlaceCard({ place, style }: PlaceCardProps) { // 3. Destructure the style prop
  const { theme } = useTheme();
  
  const handlePress = () => {
    router.push(`/place/${place.fsq_id}` as any);
  };

  return (
    // 4. Apply the passed-in style to the root component
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card[theme] }, style]}
      onPress={handlePress}
    >
      <LinearGradient colors={['#E0E7FF', '#C7D2FE']} style={styles.imagePlaceholder} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text[theme] }]} numberOfLines={1}>{place.name}</Text>
        <View style={styles.locationContainer}>
          <FontAwesome name="map-pin" size={14} color={colors.textMuted[theme]} />
          <Text style={[styles.address, { color: colors.textMuted[theme] }]} numberOfLines={1}>{place.location?.formatted_address}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        marginVertical: 8,
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
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    address: {
        fontSize: 14,
        marginLeft: 6,
        flexShrink: 1,
    },
});