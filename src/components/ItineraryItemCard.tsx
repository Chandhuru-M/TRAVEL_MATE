// src/components/ItineraryItemCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ItineraryItem } from '@/lib/types';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';

interface ItineraryItemCardProps {
  item: ItineraryItem;
}

export default function ItineraryItemCard({ item }: ItineraryItemCardProps) {
  const { theme } = useTheme();

  // --- THIS IS THE FIX: CONDITIONAL RENDERING ---
  // If the item is a 'travel' leg, render a special, simple view for it.
  if (item.type === 'travel') {
    return (
      <View style={styles.travelContainer}>
        <View style={styles.travelLine} />
        <FontAwesome name="car" size={16} color={colors.textMuted[theme]} />
        <Text style={[styles.travelText, { color: colors.textMuted[theme] }]}>
          {item.travelDetails?.estimatedDuration} min travel to {item.travelDetails?.to}
        </Text>
      </View>
    );
  }

  // Otherwise, render the full, detailed card for an attraction or restaurant.
  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.card[theme] }]}>
      <View style={styles.timeContainer}>
        <Text style={[styles.timeText, { color: colors.text[theme] }]}>{item.startTime}</Text>
      </View>
      <View style={styles.detailsContainer}>
        {/* We use optional chaining (?.) here for maximum safety */}
        <Text style={[styles.title, { color: colors.text[theme] }]}>{item.place?.name}</Text>
        <Text style={[styles.address, { color: colors.textMuted[theme] }]}>{item.place?.location?.formatted_address}</Text>
        {item.notes && <Text style={[styles.notes, { color: colors.text[theme] }]}>Notes: {item.notes}</Text>}
      </View>
      <View style={styles.durationContainer}>
        <Text style={[styles.timeText, { color: colors.textMuted[theme] }]}>{item.endTime}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  timeContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  durationContainer: {
    alignItems: 'center',
    marginLeft: 16,
  },
  timeText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  detailsContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  address: {
    fontSize: 14,
    marginTop: 4,
  },
  notes: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
  },
  travelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  travelLine: {
    width: 2,
    height: '100%',
    backgroundColor: '#334155', // A subtle line color
    position: 'absolute',
    left: 24,
    top: -16, // Extend line to connect with card above
  },
  travelText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});