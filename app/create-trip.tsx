// app/create-trip.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import KeyboardAwareScrollView from '@/utils/keyboardAware'
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { useTripStore } from '@/services/tripService';
import { router } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

export default function CreateTripScreen() {
  const { theme } = useTheme();
  const { createTripPlan } = useTripStore.getState();

  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  const handleCreate = async () => {
    if (!name || !destination || !budget) {
      Alert.alert("Missing Information", "Please fill out all fields.");
      return;
    }
    const budgetAmount = parseFloat(budget);
    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      Alert.alert("Invalid Budget", "Please enter a valid budget amount.");
      return;
    }

    await createTripPlan({
      name,
      destination,
      dates: { start: startDate.toISOString(), end: endDate.toISOString() },
      budget: { totalAmount: budgetAmount, currency: 'INR' },
    });

    Alert.alert("Trip Created!", `Your trip "${name}" has been successfully created.`);
    router.back();
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    // Hide the picker on both Android and iOS
    setShowPicker(null);
    if (selectedDate) {
      if (showPicker === 'start') {
        setStartDate(selectedDate);
        // Ensure end date is not before start date
        if (selectedDate > endDate) {
          setEndDate(selectedDate);
        }
      } else if (showPicker === 'end') {
        setEndDate(selectedDate);
      }
    }
  };

  const dynamicStyles = {
    container: { backgroundColor: colors.background[theme] },
    input: {
      backgroundColor: colors.card[theme],
      color: colors.text[theme],
      borderColor: colors.border[theme],
    },
    label: { color: colors.textMuted[theme] },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
  <KeyboardAvoidingView behavior={(Platform.OS as string) === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }} enableOnAndroid enableAutomaticScroll>
          <View style={styles.form}>
        <Text style={[styles.label, dynamicStyles.label]}>Trip Name</Text>
        <TextInput
          style={[styles.input, dynamicStyles.input]}
          placeholder="e.g., Summer Vacation in Goa"
          placeholderTextColor={colors.textMuted[theme]}
          value={name}
          onChangeText={setName}
        />

        <Text style={[styles.label, dynamicStyles.label]}>Destination</Text>
        <TextInput
          style={[styles.input, dynamicStyles.input]}
          placeholder="e.g., Goa, India"
          placeholderTextColor={colors.textMuted[theme]}
          value={destination}
          onChangeText={setDestination}
        />

        <Text style={[styles.label, dynamicStyles.label]}>Budget (INR)</Text>
        <TextInput
          style={[styles.input, dynamicStyles.input]}
          placeholder="e.g., 50000"
          placeholderTextColor={colors.textMuted[theme]}
          value={budget}
          onChangeText={setBudget}
          keyboardType="numeric"
        />

        <Text style={[styles.label, dynamicStyles.label]}>Start Date</Text>
        <TouchableOpacity style={[styles.input, styles.datePickerButton, dynamicStyles.input]} onPress={() => setShowPicker('start')}>
          <Text style={{ color: colors.text[theme], fontSize: 16 }}>{format(startDate, 'PPP')}</Text>
        </TouchableOpacity>

        <Text style={[styles.label, dynamicStyles.label]}>End Date</Text>
        <TouchableOpacity style={[styles.input, styles.datePickerButton, dynamicStyles.input]} onPress={() => setShowPicker('end')}>
          <Text style={{ color: colors.text[theme], fontSize: 16 }}>{format(endDate, 'PPP')}</Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={showPicker === 'start' ? startDate : endDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            minimumDate={showPicker === 'start' ? new Date(new Date().setHours(0,0,0,0)) : new Date(Math.max(startDate.getTime(), new Date().setHours(0,0,0,0)) + 24*60*60*1000)}
          />
        )}
        
        <TouchableOpacity style={styles.button} onPress={handleCreate}>
          <Text style={styles.buttonText}>Create Trip Plan</Text>
        </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: { padding: 20, paddingTop: 40 },
  label: { fontSize: 16, marginBottom: 8, fontWeight: '500' },
  input: {
    paddingHorizontal: 16,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  datePickerButton: {
    height: 50, // Standardize height
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});