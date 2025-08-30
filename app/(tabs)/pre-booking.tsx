// app/(tabs)/pre-booking.tsx
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import CustomHeader from '@/components/CustomHeader';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import HotelCard from '../hotels/HotelCard';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

const hotels = [
  { id: '1', name: 'Grand Palace', location: 'Chennai', price: 120, rating: 4.5, image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb', discount: '20%' },
  { id: '2', name: 'Beach Resort', location: 'Goa', price: 150, rating: 4.8, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', discount: '15%' },
  { id: '3', name: 'City Inn', location: 'Mumbai', price: 80, rating: 4.2, image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267', discount: '10%' },
  { id: '4', name: 'Hill View', location: 'Ooty', price: 100, rating: 4.3, image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470', discount: '12%' },
  { id: '5', name: 'Luxury Stay', location: 'Delhi', price: 200, rating: 4.9, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945', discount: '25%' },
];

export default function PreBookingScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [searchText, setSearchText] = useState('');

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return hotels;
    return hotels.filter(h => h.name.toLowerCase().includes(q) || h.location.toLowerCase().includes(q));
  }, [searchText]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background[theme] }}>
      <CustomHeader />
      <KeyboardAvoidingView behavior={(Platform.OS as string) === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <HotelCard
              hotel={item}
              onPress={() => router.push((`/hotels/details?hotel=${encodeURIComponent(JSON.stringify(item))}`) as any)}
            />
          )}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textMuted[theme] }]}>No hotels found.</Text>}
          ListHeaderComponent={(
            <View style={styles.container}>
              <View style={styles.searchSection}>
                <Text style={[styles.welcomeTitle, { color: colors.text[theme] }]}>Hotel Pre-booking</Text>

                <View style={[styles.searchBar, { backgroundColor: colors.card[theme] }]}>
                  <FontAwesome name="search" size={18} color={colors.textMuted[theme]} />
                  <TextInput
                    placeholder="Search hotels or location"
                    placeholderTextColor={colors.textMuted[theme]}
                    style={[styles.searchInput, { color: colors.text[theme] }]}
                    value={searchText}
                    onChangeText={setSearchText}
                    returnKeyType="search"
                  />
                  <TouchableOpacity onPress={() => {}} style={[styles.searchButton, { backgroundColor: colors.primary[theme] }]}>
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Search</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  searchSection: { paddingHorizontal: 16, paddingTop: 16 },
  welcomeTitle: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, height: 48 },
  searchInput: { marginLeft: 10, fontSize: 16, flex: 1 },
  searchButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginLeft: 8, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 30 },
});