// src/components/CustomHeader.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import Constants from 'expo-constants'; // 1. Import Constants
import { useTheme } from '@/context/ThemeContext'; // 2. Import useTheme
import { colors } from '@/constants/Colors'; // 3. Import our colors

export default function CustomHeader() {
  const { theme, toggleTheme } = useTheme(); // 4. Get the current theme and toggle function

  return (
    // 5. The main View now uses the StyleSheet which contains your padding logic
    <View style={styles.container}>
      <View>
        {/* Use dynamic text color */}
        <Text style={[styles.logoText, { color: colors.text[theme] }]}>TravelMate</Text>
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity onPress={toggleTheme} style={styles.actionButton}>
          {/* Use dynamic icon and color */}
          <FontAwesome name={theme === 'dark' ? 'sun-o' : 'moon-o'} size={22} color={colors.text[theme]} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/profile' as any)} style={styles.actionButton}>
          {/* Use dynamic icon color */}
          <FontAwesome name="user-circle" size={22} color={colors.text[theme]} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // 6. THIS IS YOUR WORKING SOLUTION, RE-IMPLEMENTED
    // It adds padding to the top equal to the status bar's height plus a little extra space.
    paddingTop: Constants.statusBarHeight + 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    // The background color is now handled by the screen itself, not the header, for better theme control.
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
});