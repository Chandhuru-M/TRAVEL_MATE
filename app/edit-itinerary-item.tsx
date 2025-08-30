import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import KeyboardAwareScrollView from '@/utils/keyboardAware'
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { useTripStore } from '@/services/tripService';
import { router, useLocalSearchParams } from 'expo-router';
import { Place } from '@/lib/types';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format, parse } from 'date-fns';

export default function EditItineraryItemScreen() {
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  const { addItineraryItem, updateItineraryItem } = useTripStore.getState();
  
  const tripId = params.tripId as string;
  const day = parseInt(params.day as string);
  const existingItem = params.item ? JSON.parse(params.item as string) : null;
  const prefilledStartTime = params.startTime as string;

  const [title, setTitle] = useState(existingItem?.place?.name || '');

  const [startTime, setStartTime] = useState(parse(existingItem?.startTime || prefilledStartTime || '10:00', 'HH:mm', new Date()));
  const [endTime, setEndTime] = useState(parse(existingItem?.endTime || '11:00', 'HH:mm', new Date()));
  const [notes, setNotes] = useState(existingItem?.notes || '');
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  const handleSave = async () => {
    if (!title) {
      Alert.alert("Missing Info", "Please provide an event title.");
      return;
    }
    // Ensure end time is after start time
    if (startTime >= endTime) {
      Alert.alert("Invalid Time", "End time must be after the start time.");
      return;
    }

    const formattedStartTime = format(startTime, 'HH:mm');
    const formattedEndTime = format(endTime, 'HH:mm');

    if (existingItem) {
      await updateItineraryItem(tripId, {
        ...existingItem,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        notes,
        place: { ...existingItem.place, name: title },
      });
    } else {
      const newPlace: Place = {
        fsq_id: `manual_${Date.now()}`,
        name: title,
        categories: [{ name: 'Custom Event' }],
      };
      await addItineraryItem(tripId, {
        day,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        notes,
        place: newPlace,
        isDefault: false,
      });
    }
    router.back();
  };
  
  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || (showPicker === 'start' ? startTime : endTime);
    setShowPicker(null);
    if (showPicker === 'start') {
      setStartTime(currentDate);
    } else {
      setEndTime(currentDate);
    }
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }} enableOnAndroid enableAutomaticScroll>
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
            <Text style={[styles.label, { color: colors.text[theme] }]}>Start Time</Text>
            <TouchableOpacity style={[styles.input, styles.timePickerButton, dynamicStyles.input]} onPress={() => setShowPicker('start')}>
              <Text style={{ color: colors.text[theme], fontSize: 16 }}>{format(startTime, 'h:mm a')}</Text>
            </TouchableOpacity>
          </View>
          <View style={{flex: 1}}>
            <Text style={[styles.label, { color: colors.text[theme] }]}>End Time</Text>
            <TouchableOpacity style={[styles.input, styles.timePickerButton, dynamicStyles.input]} onPress={() => setShowPicker('end')}>
              <Text style={{ color: colors.text[theme], fontSize: 16 }}>{format(endTime, 'h:mm a')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showPicker && (
          <DateTimePicker
            value={showPicker === 'start' ? startTime : endTime}
            mode="time"
            display="default"
            onChange={onDateChange}
          />
        )}

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
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
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
  timePickerButton: { 
    justifyContent: 'center' 
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