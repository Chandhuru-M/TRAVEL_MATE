// app/(tabs)/map.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import CustomHeader from '@/components/CustomHeader';
import { useTheme } from '@/context/ThemeContext'; // Import useTheme
import { colors } from '@/constants/Colors'; // Import colors
console.log("Entered Map screen");
export default function MapScreen() {
  const { theme } = useTheme(); 

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background[theme] }}>
      <CustomHeader />
      <View style={styles.content}>
        <FontAwesome name="map-o" size={80} color={colors.textMuted[theme]} />
        <Text style={[styles.title, { color: colors.text[theme] }]}>Map View</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted[theme] }]}>
          Map view is not embedded. Use the chat's Get Directions to open Google Maps.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
});