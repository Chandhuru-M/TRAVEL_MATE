// app/add-transaction.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { useFinanceStore } from '@/services/financeService';
import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
// You would use a picker library for a real app, but we'll simulate it.
import { Picker } from '@react-native-picker/picker';

export default function AddTransactionScreen() {
  const { theme } = useTheme();
  const { accounts, addTransaction } = useFinanceStore();
  const params = useLocalSearchParams() as { tripId?: string };
  const prefilledTripId = params.tripId ?? null;
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [selectedAccount, setSelectedAccount] = useState<string | undefined>(accounts[0]?.id);

  const handleAdd = async () => {
    if (!description || !amount || !selectedAccount) {
      Alert.alert("Missing Information", "Please fill out all fields.");
      return;
    }
    await addTransaction({
      description,
      amount: parseFloat(amount),
      type,
      account_id: selectedAccount,
      trip_id: prefilledTripId ?? null,
      category: 'General',
    });
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background[theme] }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.form}>
        {/* Description Input */}
        <Text style={{ color: colors.text[theme] }}>Description</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.card[theme], color: colors.text[theme], borderColor: colors.border[theme] },
          ]}
          value={description}
          onChangeText={setDescription}
          placeholderTextColor={colors.textMuted[theme]}
          placeholder=""
        />

        {/* Amount Input */}
        <Text style={{ color: colors.text[theme] }}>Amount</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.card[theme], color: colors.text[theme], borderColor: colors.border[theme] },
          ]}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholderTextColor={colors.textMuted[theme]}
          placeholder=""
        />

        {/* Account Picker */}
        <Text style={{ color: colors.text[theme] }}>Account</Text>
        <Picker
          selectedValue={selectedAccount}
          onValueChange={(itemValue) => setSelectedAccount(itemValue)}
          style={{ color: colors.textMuted[theme] }}
          dropdownIconColor={colors.textMuted[theme]}
        >
          {accounts.map(acc => (
            <Picker.Item key={acc.id} label={acc.name} value={acc.id} color={colors.textMuted[theme]} />
          ))}
        </Picker>

        <TouchableOpacity style={styles.button} onPress={handleAdd}>
          <Text style={styles.buttonText}>Save Transaction</Text>
        </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  form: { padding: 20 },
  input: { padding: 14, borderRadius: 8, fontSize: 16, marginBottom: 20, borderWidth: 1 },
  button: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold' },
});