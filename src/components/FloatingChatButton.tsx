// src/components/FloatingChatButton.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import useKeyboardVisible from '@/hooks/useKeyboardVisible'

export default function FloatingChatButton() {
  const keyboardVisible = useKeyboardVisible()
  const handlePress = () => {
    router.push('/chat' as any);
  };

  return (
    !keyboardVisible ? (
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <FontAwesome name="comment" size={24} color="white" />
      </TouchableOpacity>
    ) : null
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    // Positioned in the bottom-right
    bottom: 80,
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
    elevation: 8,
  },
});