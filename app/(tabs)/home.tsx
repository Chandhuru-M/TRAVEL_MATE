// app/(tabs)/home.tsx
import React from 'react';
import { StyleSheet, FlatList, View } from 'react-native'; // <-- Must be a simple View
import PlaceCard from '@/components/PlaceCard';
import CustomHeader from '@/components/CustomHeader';
import { mockPlaces } from '@/lib/mock-data';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';

export default function HomeScreen() {
  const { theme } = useTheme();

  return (
    // The root View gets the dynamic background color.
    <View style={[styles.container, { backgroundColor: colors.background[theme] }]}>
      <CustomHeader />
      <FlatList
        data={mockPlaces}
        renderItem={({ item }) => <PlaceCard place={item} />}
        keyExtractor={(item) => item.fsq_id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});