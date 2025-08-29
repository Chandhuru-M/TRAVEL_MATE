// src/components/CustomHeader.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';

export default function CustomHeader({ showSettings = true, extraRight }: { showSettings?: boolean; extraRight?: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <View style={styles.container}>
      <View>
        <Text style={[styles.logoText, { color: colors.text[theme] }]}>TravelMate</Text>
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity onPress={toggleTheme} style={styles.actionButton}>
          <FontAwesome name={theme === 'dark' ? 'sun-o' : 'moon-o'} size={22} color={colors.text[theme]} />
        </TouchableOpacity>
        {extraRight}
        {showSettings ? (
          <TouchableOpacity onPress={() => router.push('/settings' as any)} style={styles.actionButton}>
            <FontAwesome name="cog" size={22} color={colors.text[theme]} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={() => router.push('/profile' as any)} style={styles.actionButton}>
          <FontAwesome name="user-circle" size={22} color={colors.text[theme]} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Constants.statusBarHeight + 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
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