// app/(tabs)/map.tsx
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, Animated } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import CustomHeader from '@/components/CustomHeader';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import GroupMapView from '@/components/GroupMapView'; // Import the group map component
import SoloMapView from '@/components/SoloMapView';

export default function MapScreen() {
  const { theme } = useTheme();
  const [mode, setMode] = useState<'group' | 'solo'>('group');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const toggleMode = (next: 'group' | 'solo') => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      setMode(next);
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background[theme] }}>
      <CustomHeader />
      <View style={{ flex: 1 }}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          {mode === 'group' ? (
            <GroupMapView onLeave={() => {}} />
          ) : (
            <SoloMapView />
          )}
        </Animated.View>

        {/* In-map floating toggle button */}
        <TouchableOpacity
          onPress={() => toggleMode(mode === 'group' ? 'solo' : 'group')}
          style={{ position: 'absolute', top: 90, right: 16, backgroundColor: colors.primary[theme], padding: 12, borderRadius: 28, elevation: 8 }}
        >
          <FontAwesome name={mode === 'group' ? 'map' : 'users'} size={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 20, // Space between the buttons
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.dark,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '90%', // Make the buttons wide
    // Add a nice shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
});