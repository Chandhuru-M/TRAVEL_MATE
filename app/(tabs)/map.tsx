// app/(tabs)/map.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import CustomHeader from '@/components/CustomHeader';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import GroupMapView from '@/components/GroupMapView'; // Import the group map component

export default function MapScreen() {
  const { theme } = useTheme();
  const [isGroupView, setIsGroupView] = useState(false); // State to control which view is shown

  const handleShowOwnLocation = () => {
    Alert.alert("Show My Location", "This will be integrated with a solo map view in the future.");
  };

  // If the user has chosen to view the group map, render that component.
  // We pass a function to allow the GroupMapView to set isGroupView back to false.
  if (isGroupView) {
    return <GroupMapView onLeave={() => setIsGroupView(false)} />;
  }

  // Otherwise, show our new "launchpad" screen.
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background[theme] }}>
      <CustomHeader />
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text[theme] }]}>Map Options</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted[theme] }]}>
          Choose a map mode to continue
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={() => setIsGroupView(true)}>
            <FontAwesome name="users" size={24} color="white" />
            <Text style={styles.buttonText}>Group Location Sharing</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleShowOwnLocation}>
            <FontAwesome name="location-arrow" size={24} color="white" />
            <Text style={styles.buttonText}>Show My Location</Text>
          </TouchableOpacity>
        </View>
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