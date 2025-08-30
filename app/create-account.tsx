// app/create-account.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import KeyboardAwareScrollView from '@/utils/keyboardAware'
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { useFinanceStore } from '@/services/financeService';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

export default function CreateAccountScreen() {
  const { theme } = useTheme();
  const { createAccount } = useFinanceStore.getState();
  const [name, setName] = useState('');
  const [type, setType] = useState<'bank_account' | 'credit_card' | 'cash' | 'e-wallet'>('bank_account');
  const [balance, setBalance] = useState('');

  const handleCreate = async () => {
    if (!name || !balance) {
      Alert.alert("Missing Information", "Please fill out all fields.");
      return;
    }
    const initialBalance = parseFloat(balance);
    if (isNaN(initialBalance)) {
      Alert.alert("Invalid Balance", "Please enter a valid number for the balance.");
      return;
    }
    await createAccount(name, type, initialBalance);
    router.back();
  };

  const dynamicStyles = {
    input: { backgroundColor: colors.card[theme], color: colors.text[theme], borderColor: colors.border[theme] },
    label: { color: colors.textMuted[theme] },
    picker: { color: colors.textMuted[theme] },
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background[theme] }}>
      <KeyboardAvoidingView behavior={(Platform.OS as string) === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }} enableOnAndroid enableAutomaticScroll>
          <View style={styles.form}>
            <Text style={[styles.label, dynamicStyles.label]}>Account Name</Text>
            <TextInput style={[styles.input, dynamicStyles.input]} placeholder="e.g., HDFC Bank Savings" placeholderTextColor={colors.textMuted[theme]} value={name} onChangeText={setName} />

            <Text style={[styles.label, dynamicStyles.label]}>Initial Balance (INR)</Text>
            <TextInput style={[styles.input, dynamicStyles.input]} placeholder="e.g., 50000" placeholderTextColor={colors.textMuted[theme]} value={balance} onChangeText={setBalance} keyboardType="numeric" />

            <Text style={[styles.label, dynamicStyles.label]}>Account Type</Text>
            <View style={[styles.input, dynamicStyles.input]}>
              <Picker
                selectedValue={type}
                onValueChange={(itemValue) => setType(itemValue)}
                style={dynamicStyles.picker}
                dropdownIconColor={colors.textMuted[theme]}
              >
                <Picker.Item label="Bank Account" value="bank_account" color={colors.textMuted[theme]} />
                <Picker.Item label="Credit Card" value="credit_card" color={colors.textMuted[theme]} />
                <Picker.Item label="Cash" value="cash" color={colors.textMuted[theme]} />
                <Picker.Item label="E-Wallet" value="e-wallet" color={colors.textMuted[theme]} />
              </Picker>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleCreate}>
              <Text style={styles.buttonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  form: { padding: 20, paddingTop: 40 },
  label: { fontSize: 16, marginBottom: 8 },
  input: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 8, fontSize: 16, marginBottom: 20, borderWidth: 1 },
  button: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});