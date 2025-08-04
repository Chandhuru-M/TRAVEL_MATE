// app/(tabs)/map.tsx (Temporarily Disabled for Expo Go)

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MapScreenPlaceholder = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Map Feature</Text>
        <Text style={styles.subtitle}>
          The interactive map is available in the full app build.
        </Text>
        <Text style={styles.info}>
          To run this feature, you need to create a custom development build.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  info: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});

export default MapScreenPlaceholder;