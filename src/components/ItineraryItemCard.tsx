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

  // Render a different style for travel legs vs. attractions
  if (item.type === 'travel') {
    return (
      <View style={styles.travelContainer}>
        <FontAwesome name="car" size={16} color={colors.textMuted[theme]} />
        <Text style={[styles.travelText, { color: colors.textMuted[theme] }]}>
          {item.travelDetails?.estimatedDuration} min travel to {item.travelDetails?.to}
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.card[theme] }]}>
      <View style={styles.timeContainer}>
        <Text style={[styles.timeText, { color: colors.text[theme] }]}>{item.startTime}</Text>
        <View style={[styles.timeLine, { backgroundColor: colors.border[theme] }]} />
        <Text style={[styles.timeText, { color: colors.text[theme] }]}>{item.endTime}</Text>
      </View>
      <View style={styles.detailsContainer}>
        <Text style={[styles.title, { color: colors.text[theme] }]}>{item.place?.name}</Text>
        <Text style={[styles.address, { color: colors.textMuted[theme] }]}>{item.place?.location?.formatted_address}</Text>
        {item.notes && <Text style={[styles.notes, { color: colors.text[theme] }]}>Notes: {item.notes}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  timeContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  timeText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  timeLine: {
    width: 2,
    flex: 1,
    marginVertical: 8,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  travelText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});