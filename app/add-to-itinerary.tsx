// app/add-to-itinerary.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';

export default function AddToItineraryScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background[theme] }}>
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.card[theme] }]}>
          <FontAwesome name="search" size={20} color={colors.textMuted[theme]} />
          <TextInput
            placeholder="Search for hotels, restaurants..."
            placeholderTextColor={colors.textMuted[theme]}
            style={[styles.searchInput, { color: colors.text[theme] }]}
          />
        </View>
      </View>
      {/* The list of search results will be displayed here */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchContainer: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 16, height: 50 },
  searchInput: { marginLeft: 12, fontSize: 16, flex: 1 },
});