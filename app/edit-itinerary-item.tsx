import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { useTripStore } from '@/services/tripService';
import { router, useLocalSearchParams } from 'expo-router';
import { Place } from '@/lib/types'; // Import the Place type

export default function EditItineraryItemScreen() {
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  const { addItineraryItem, updateItineraryItem } = useTripStore.getState();
  
  // Params will include tripId, day, and an optional 'item' if we are editing
  const tripId = params.tripId as string;
  const day = parseInt(params.day as string);
  const existingItem = params.item ? JSON.parse(params.item as string) : null;
  const prefilledStartTime = params.startTime as string;

  const [title, setTitle] = useState(existingItem?.place?.name || '');
  const [startTime, setStartTime] = useState(existingItem?.startTime || prefilledStartTime || '10:00');
  const [endTime, setEndTime] = useState(existingItem?.endTime || '11:00');
  const [notes, setNotes] = useState(existingItem?.notes || '');

  const handleSave = async () => {
    if (!title || !startTime || !endTime) {
      Alert.alert("Missing Info", "Please provide a title and start/end times.");
      return;
    }

    if (existingItem) {
      // Update the existing item's place name
      await updateItineraryItem(tripId, {
        ...existingItem,
        startTime,
        endTime,
        notes,
        place: { ...existingItem.place, name: title },
      });
    } else {
      // --- THIS IS THE FIX ---
      // Create a new, valid "dummy" Place object for the manual entry
      const newPlace: Place = {
        fsq_id: `manual_${Date.now()}`, // Create a unique ID
        name: title,
        categories: [{ name: 'Custom Event' }], // Provide a default category
      };

      // --- FIX: Ensure all required properties are passed ---
      await addItineraryItem(tripId, {
        day,
        startTime,
        endTime,
        notes,
        place: newPlace,
        isDefault: false, // This is required
      });
      // --- END OF FIX ---
    }
    router.back();
  };

  const dynamicStyles = {
    input: {
      backgroundColor: colors.card[theme],
      color: colors.text[theme],
      borderColor: colors.border[theme],
    },
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background[theme] }}>
      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.text[theme] }]}>Event Title</Text>
        <TextInput 
          style={[styles.input, dynamicStyles.input]} 
          value={title} 
          onChangeText={setTitle}
          placeholder="Enter event name"
          placeholderTextColor={colors.textMuted[theme]}
        />
        
        <View style={{flexDirection: 'row', gap: 16}}>
          <View style={{flex: 1}}>
            <Text style={[styles.label, { color: colors.text[theme] }]}>Start Time (HH:mm)</Text>
            <TextInput 
              style={[styles.input, dynamicStyles.input]} 
              value={startTime} 
              onChangeText={setStartTime}
              placeholder="10:00"
              placeholderTextColor={colors.textMuted[theme]}
            />
          </View>
          <View style={{flex: 1}}>
            <Text style={[styles.label, { color: colors.text[theme] }]}>End Time (HH:mm)</Text>
            <TextInput 
              style={[styles.input, dynamicStyles.input]} 
              value={endTime} 
              onChangeText={setEndTime}
              placeholder="11:00"
              placeholderTextColor={colors.textMuted[theme]}
            />
          </View>
        </View>

        <Text style={[styles.label, { color: colors.text[theme] }]}>Notes (Optional)</Text>
        <TextInput 
          style={[styles.input, styles.textArea, dynamicStyles.input]} 
          value={notes} 
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          placeholder="Add any additional notes..."
          placeholderTextColor={colors.textMuted[theme]}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>
            {existingItem ? 'Update Event' : 'Add Event'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  form: { 
    padding: 20, 
    paddingTop: 40 
  },
  label: { 
    fontSize: 16, 
    marginBottom: 8, 
    fontWeight: '500' 
  },
  input: { 
    padding: 14, 
    borderRadius: 8, 
    fontSize: 16, 
    marginBottom: 20, 
    borderWidth: 1 
  },
  textArea: { 
    height: 80, 
    textAlignVertical: 'top' 
  },
  saveButton: { 
    backgroundColor: '#2563eb', 
    paddingVertical: 16, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 16 
  },
  saveButtonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});