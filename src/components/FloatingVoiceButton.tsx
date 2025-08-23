// src/components/FloatingVoiceButton.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export default function FloatingVoiceButton() {
  const handlePress = () => {
    // --- INTEGRATION SPACE ---
    // This will later open the full voice assistant modal/screen.
    // For now, it shows an alert.
    Alert.alert(
      "Voice Assistant",
      "The AI voice assistant will be integrated here."
    );
    // -------------------------
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handlePress}>
      <FontAwesome name="microphone" size={24} color="white" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 80, // Position it above the tab bar
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8, // for Android
  },
});