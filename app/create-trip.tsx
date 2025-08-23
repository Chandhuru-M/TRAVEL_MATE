// app/create-trip.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { useTripStore } from '@/services/tripService';
import { router } from 'expo-router';

export default function CreateTripScreen() {
  const { theme } = useTheme();
  const { createTripPlan } = useTripStore();
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState('');

  const handleCreate = () => {
    if (!name || !destination || !budget) {
      Alert.alert("Missing Information", "Please fill out all fields.");
      return;
    }
    const budgetAmount = parseFloat(budget);
    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      Alert.alert("Invalid Budget", "Please enter a valid budget amount.");
      return;
    }

    // For simplicity, we'll use today's date for short trips.
    // A real app would have date pickers.
    const today = new Date().toISOString();

    createTripPlan({
      name,
      destination,
      dates: { start: today, end: today },
      budget: { totalAmount: budgetAmount, currency: 'INR' },
    });

    Alert.alert("Trip Created!", `Your trip "${name}" has been successfully created.`);
    router.back(); // Go back to the trip planner screen
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
      <View style={styles.form}>
        <Text style={[styles.label, dynamicStyles.label]}>Trip Name</Text>
        <TextInput
          style={[styles.input, dynamicStyles.input]}
          placeholder="e.g., Dinner at Pizza Palace"
          placeholderTextColor={colors.textMuted[theme]}
          value={name}
          onChangeText={setName}
        />

        <Text style={[styles.label, dynamicStyles.label]}>Destination or Place</Text>
        <TextInput
          style={[styles.input, dynamicStyles.input]}
          placeholder="e.g., Pizza Palace, City Center"
          placeholderTextColor={colors.textMuted[theme]}
          value={destination}
          onChangeText={setDestination}
        />

        <Text style={[styles.label, dynamicStyles.label]}>Budget (INR)</Text>
        <TextInput
          style={[styles.input, dynamicStyles.input]}
          placeholder="e.g., 2000"
          placeholderTextColor={colors.textMuted[theme]}
          value={budget}
          onChangeText={setBudget}
          keyboardType="numeric"
        />

        <TouchableOpacity style={styles.button} onPress={handleCreate}>
          <Text style={styles.buttonText}>Create Trip Plan</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: { padding: 20 },
  label: { fontSize: 16, marginBottom: 8 },
  input: { padding: 14, borderRadius: 8, fontSize: 16, marginBottom: 20, borderWidth: 1 },
  button: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});