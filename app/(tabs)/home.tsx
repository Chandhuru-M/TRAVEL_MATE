// app/(tabs)/home.tsx
import React from 'react';
import { StyleSheet, FlatList, SafeAreaView, View } from 'react-native';
import PlaceCard from '@/components/PlaceCard';
import CustomHeader from '@/components/CustomHeader';
import { mockPlaces } from '@/lib/mock-data';

export default function HomeScreen() {
  return (
    // The SafeAreaView handles the status bar space. It should be transparent or black.
    <SafeAreaView style={styles.safeArea}>
      {/* This inner View contains all your content and has the background color. */}
      <View style={styles.container}>
        <CustomHeader />
        <FlatList
          data={mockPlaces}
          renderItem={({ item }) => <PlaceCard place={item} />}
          keyExtractor={(item) => item.fsq_id}
          contentContainerStyle={styles.list}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'black', // Ensures status bar area is black
  },
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Your app's dark theme
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});