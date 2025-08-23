// src/components/CustomHeader.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import Constants from 'expo-constants';

export default function CustomHeader() {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.logoText}>TravelMate</Text>
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity onPress={() => Alert.alert("Theme Toggle", "Dark/Light mode will be implemented here.")} style={styles.actionButton}>
          <FontAwesome name="adjust" size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/profile' as any)} style={styles.actionButton}>
          <FontAwesome name="user-circle" size={22} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Constants.statusBarHeight + 12, // Added top padding to account for the status bar
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#0f172a',
  },
  logoText: {
    color: 'white',
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