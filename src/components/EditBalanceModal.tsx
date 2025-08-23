// src/components/EditBalanceModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';

interface EditBalanceModalProps {
  isVisible: boolean;
  currentBalance: number;
  onClose: () => void;
  onSave: (newBalance: string) => void;
}

export default function EditBalanceModal({ isVisible, currentBalance, onClose, onSave }: EditBalanceModalProps) {
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState('');

  // When the modal becomes visible, pre-fill the input with the current balance
  useEffect(() => {
    if (isVisible) {
      setInputValue(currentBalance.toString());
    }
  }, [isVisible, currentBalance]);

  const dynamicStyles = {
    modalContent: { backgroundColor: colors.card[theme] },
    title: { color: colors.text[theme] },
    input: {
      backgroundColor: colors.background[theme],
      color: colors.text[theme],
      borderColor: colors.border[theme],
    },
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalBackdrop}
      >
        <View style={[styles.modalContent, dynamicStyles.modalContent]}>
          <Text style={[styles.title, dynamicStyles.title]}>Edit Total Balance</Text>
          <TextInput
            style={[styles.input, dynamicStyles.input]}
            value={inputValue}
            onChangeText={setInputValue}
            keyboardType="numeric"
            autoFocus={true}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={() => onSave(inputValue)}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '85%',
    padding: 24,
    borderRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    padding: 14,
    borderRadius: 8,
    fontSize: 18,
    marginBottom: 24,
    borderWidth: 1,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  saveButton: {
    backgroundColor: '#2563eb',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});