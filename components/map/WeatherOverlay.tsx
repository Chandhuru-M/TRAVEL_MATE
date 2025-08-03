import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, sizes } from '../../constants';

interface WeatherData {
  temperature: number; // in Fahrenheit or Celsius
  condition: 'Sunny' | 'Cloudy' | 'Rainy' | 'Stormy';
}

interface WeatherOverlayProps {
  weather: WeatherData;
}

const WeatherOverlay: React.FC<WeatherOverlayProps> = ({ weather }) => {
  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
        return 'sunny';
      case 'cloudy':
        return 'cloudy';
      case 'rainy':
        return 'rainy';
      case 'stormy':
        return 'thunderstorm';
      default:
        return 'partly-sunny';
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons name={getWeatherIcon(weather.condition)} size={28} color={Colors.textPrimary} />
      <View style={styles.textContainer}>
        <Text style={styles.temperature}>{weather.temperature}°</Text>
        <Text style={styles.condition}>{weather.condition}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Adjust to be below the status bar
    right: sizes.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: sizes.spacing.sm,
    paddingHorizontal: sizes.spacing.md,
    borderRadius: sizes.borderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  textContainer: {
    marginLeft: sizes.spacing.sm,
  },
  temperature: {
    fontSize: sizes.font.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  condition: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

export default WeatherOverlay;