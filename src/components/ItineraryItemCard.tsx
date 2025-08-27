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
  onPress?: () => void;
  onDelete?: () => void;
}

// --- NEW HELPER FUNCTION TO GET THE ICON ---
const getIconForEvent = (item: ItineraryItem): React.ComponentProps<typeof FontAwesome>['name'] => {
  if (item.isDefault) {
    switch (item.defaultType) {
      case 'breakfast': return 'coffee';
      case 'lunch': return 'cutlery';
      case 'dinner': return 'cutlery';
      case 'sleep': return 'bed';
      default: return 'calendar-o';
    }
  }
  // You can expand this logic for user-created events based on place categories
  const category = item.place?.categories[0]?.name.toLowerCase() || '';
  if (category.includes('hotel')) return 'hotel';
  if (category.includes('restaurant') || category.includes('food')) return 'cutlery';
  if (category.includes('museum') || category.includes('art')) return 'paint-brush';
  if (category.includes('park') || category.includes('landmark')) return 'tree';
  return 'map-marker'; // Default icon
};
// -----------------------------------------

export default function ItineraryItemCard({ item, onPress, onDelete }: ItineraryItemCardProps) {
  const { theme, timeFormat } = useTheme();

  const formatTime = (time: string) => {
    const date = parse(time, 'HH:mm', new Date());
    return format(date, timeFormat === '12h' ? 'h:mm a' : 'HH:mm');
  };

  const isDefaultEvent = item.isDefault;
  const isCustomizedDefault = item.isDefault && item.place && !item.place.fsq_id.startsWith('default_');

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

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { backgroundColor: colors.card[theme] },
        isDefaultEvent && !isCustomizedDefault && styles.defaultCard
      ]}
      onPress={onPress}
    >
      <View style={styles.timeContainer}>
        <Text style={[styles.timeText, { color: colors.text[theme] }]}>{formatTime(item.startTime)}</Text>
        <View style={[styles.timeSeparator, { backgroundColor: colors.border[theme] }]} />
        <Text style={[styles.timeText, { color: colors.textMuted[theme] }]}>{formatTime(item.endTime)}</Text>
      </View>
      
      {/* --- ICON CONTAINER --- */}
      <View style={[styles.iconContainer, { backgroundColor: colors.background[theme] }]}>
        <FontAwesome name={getIconForEvent(item)} size={20} color={colors.primary[theme]} />
      </View>
      {/* ---------------------- */}

      <View style={styles.detailsContainer}>
        <Text style={[styles.title, { color: colors.text[theme] }]}>{item.place?.name}</Text>
        {isDefaultEvent && !isCustomizedDefault ? (
          <Text style={[styles.address, { color: colors.textMuted[theme] }]}>Tap to edit time or add a place</Text>
        ) : (
          <Text style={[styles.address, { color: colors.textMuted[theme] }]} numberOfLines={1}>{item.place?.location?.formatted_address}</Text>
        )}
        {item.notes && <Text style={[styles.notes, { color: colors.text[theme] }]}>Notes: {item.notes}</Text>}
      </View>
      {!isDefaultEvent && onDelete && (
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
    borderColor: 'transparent' 
  },
  defaultCard: { 
    borderStyle: 'dashed', 
    borderColor: '#475569' 
  },
  timeContainer: { 
    alignItems: 'center', 
    marginRight: 12 
  },
  timeText: { 
    fontWeight: 'bold', 
    fontSize: 14 
  },
  timeSeparator: { 
    height: 12, 
    width: 2, 
    marginVertical: 4, 
    borderRadius: 1 
  },
  // --- NEW STYLES ---
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  // ------------------
  detailsContainer: { 
    flex: 1 
  },
  title: { 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  address: { 
    fontSize: 14, 
    marginTop: 4 
  },
  notes: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
  },
  deleteButton: { 
    padding: 8, 
    marginLeft: 8 
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