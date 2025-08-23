// app/settings.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { theme } = useTheme();

  const dynamicStyles = {
    container: {
      backgroundColor: colors.background[theme],
    },
    title: {
      color: colors.text[theme],
    },
    subtitle: {
      color: colors.textMuted[theme],
    },
    icon: {
      color: colors.textMuted[theme],
    },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <View style={styles.content}>
        <FontAwesome name="cogs" size={80} style={dynamicStyles.icon} />
        <Text style={[styles.title, dynamicStyles.title]}>App Settings</Text>
        <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
          User preferences, notifications, and other settings will be configured here.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
});