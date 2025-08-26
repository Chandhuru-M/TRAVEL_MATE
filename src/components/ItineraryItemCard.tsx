// src/components/ItineraryItemCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ItineraryItem } from '@/lib/types';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { format, parse } from 'date-fns';

interface ItineraryItemCardProps {
  item: ItineraryItem;
  onPress: () => void;
  onDelete: () => void;
}

export default function ItineraryItemCard({ item, onPress, onDelete }: ItineraryItemCardProps) {
  const { theme, timeFormat } = useTheme();

  const formatTime = (time: string) => {
    try {
      const date = parse(time, 'HH:mm', new Date());
      return format(date, timeFormat === '12h' ? 'h:mm a' : 'HH:mm');
    } catch (e) {
      return time; // Fallback to raw time if parsing fails
    }
  };

  const isDefaultEvent = item.isDefault;

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

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { backgroundColor: colors.card[theme] },
        isDefaultEvent && !item.place?.fsq_id.startsWith('manual_') && styles.defaultCard
      ]}
      onPress={onPress}
    >
      {/* --- THIS IS THE FIX --- */}
      <View style={styles.timeContainer}>
        <Text style={[styles.timeText, { color: colors.text[theme] }]}>{formatTime(item.startTime)}</Text>
        <View style={[styles.timeSeparator, { backgroundColor: colors.border[theme] }]} />
        <Text style={[styles.timeText, { color: colors.textMuted[theme] }]}>{formatTime(item.endTime)}</Text>
      </View>
      {/* ----------------------- */}

      <View style={styles.detailsContainer}>
        <Text style={[styles.title, { color: colors.text[theme] }]}>{item.place?.name}</Text>
        {isDefaultEvent && !item.place?.fsq_id.startsWith('manual_') ? (
          <Text style={[styles.address, { color: colors.textMuted[theme] }]}>Tap to edit time or add a place</Text>
        ) : (
          <Text style={[styles.address, { color: colors.textMuted[theme] }]} numberOfLines={1}>{item.place?.location?.formatted_address}</Text>
        )}
        {item.notes && <Text style={[styles.notes, { color: colors.text[theme] }]}>Notes: {item.notes}</Text>}
      </View>
      {!isDefaultEvent && (
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <FontAwesome name="trash-o" size={20} color={colors.textMuted[theme]} />
        </TouchableOpacity>
      )}
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  defaultCard: {
    borderStyle: 'dashed',
    borderColor: '#475569',
  },
  timeContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  timeText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  // --- NEW STYLE FOR THE SEPARATOR ---
  timeSeparator: {
    height: 12,
    width: 2,
    marginVertical: 4,
    borderRadius: 1,
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
  deleteButton: {
    padding: 8,
    marginLeft: 8,
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
    backgroundColor: '#334155',
    position: 'absolute',
    left: 24,
    top: -16,
  },
  travelText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});