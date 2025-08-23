// app/add-transaction.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { useWalletStore } from '@/services/walletService';
import { useTripStore } from '@/services/tripService';
import { router } from 'expo-router';

export default function AddTransactionScreen() {
  const { theme } = useTheme();
  const { addTransaction } = useWalletStore();
  const activeTrip = useTripStore((state) => state.getActiveTripPlan());

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const handleAdd = () => {
    if (!description || !amount) {
      Alert.alert("Missing Information", "Please fill out all fields.");
      return;
    }
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }

    const newExpense = {
      amount: amountValue,
      description,
      type: 'debit' as 'debit',
    };

    // Ask the user if they want to deduct from their main balance
    Alert.alert(
      "Update Balance?",
      "Do you want to deduct this amount from your total wallet balance?",
      [
        { text: "Don't Deduct", style: 'cancel', onPress: () => processTransaction(false) },
        { text: "Yes, Deduct", onPress: () => processTransaction(true) },
      ]
    );

    const processTransaction = (deductFromBalance: boolean) => {
      if (activeTrip) {
        // Ask the user if they want to link to the active trip
        Alert.alert(
          "Link to Trip?",
          `Should this expense be linked to your active trip: "${activeTrip.name}"?`,
          [
            { text: "No, just add to wallet", onPress: () => {
              addTransaction({ ...newExpense, tripId: 'wallet' }, deductFromBalance);
              router.back();
            }},
            { text: "Yes, link to trip", onPress: () => {
              addTransaction({ ...newExpense, tripId: activeTrip.id }, deductFromBalance);
              router.back();
            }},
          ]
        );
      } else {
        // If no trip is active, just add it to the wallet
        addTransaction({ ...newExpense, tripId: 'wallet' }, deductFromBalance);
        router.back();
      }
    };
  };

  const dynamicStyles = {
    container: { backgroundColor: colors.background[theme] },
    input: { backgroundColor: colors.card[theme], color: colors.text[theme], borderColor: colors.border[theme] },
    label: { color: colors.textMuted[theme] },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <View style={styles.form}>
        <Text style={[styles.label, dynamicStyles.label]}>Event / Description</Text>
        <TextInput
          style={[styles.input, dynamicStyles.input]}
          placeholder="e.g., Lunch with friends"
          placeholderTextColor={colors.textMuted[theme]}
          value={description}
          onChangeText={setDescription}
        />

        <Text style={[styles.label, dynamicStyles.label]}>Amount Spent (INR)</Text>
        <TextInput
          style={[styles.input, dynamicStyles.input]}
          placeholder="e.g., 1250"
          placeholderTextColor={colors.textMuted[theme]}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        <TouchableOpacity style={styles.button} onPress={handleAdd}>
          <Text style={styles.buttonText}>Add Transaction</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: { padding: 20, paddingTop: 40 },
  label: { fontSize: 16, marginBottom: 8 },
  input: { padding: 14, borderRadius: 8, fontSize: 16, marginBottom: 20, borderWidth: 1 },
  button: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});