// src/components/InitialBalanceModal.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';

interface InitialBalanceModalProps {
  isVisible: boolean;
  onSave: (initialBalance: string) => void;
}

export default function InitialBalanceModal({ isVisible, onSave }: InitialBalanceModalProps) {
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState('');

  const dynamicStyles = {
    modalContent: { backgroundColor: colors.card[theme] },
    title: { color: colors.text[theme] },
    subtitle: { color: colors.textMuted[theme] },
    input: {
      backgroundColor: colors.background[theme],
      color: colors.text[theme],
      borderColor: colors.border[theme],
    },
  };

  return (
    <Modal visible={isVisible} transparent={true} animationType="fade">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalBackdrop}>
        <View style={[styles.modalContent, dynamicStyles.modalContent]}>
          <Text style={[styles.title, dynamicStyles.title]}>Welcome to Your Wallet!</Text>
          <Text style={[styles.subtitle, dynamicStyles.subtitle]}>To get started, please enter your current wallet balance.</Text>
          <TextInput
            style={[styles.input, dynamicStyles.input]}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="e.g., 50000"
            placeholderTextColor={colors.textMuted[theme]}
            keyboardType="numeric"
            autoFocus={true}
          />
          <TouchableOpacity style={styles.saveButton} onPress={() => onSave(inputValue)}>
            <Text style={styles.saveButtonText}>Save & Get Started</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  modalContent: { width: '85%', padding: 24, borderRadius: 12 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
  input: { padding: 14, borderRadius: 8, fontSize: 18, marginBottom: 24, borderWidth: 1, textAlign: 'center' },
  saveButton: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 8 },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
});