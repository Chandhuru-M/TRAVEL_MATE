// app/(tabs)/pre-booking.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import CustomHeader from '@/components/CustomHeader';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import HotelCard from '../hotels/HotelCard';
import { useRouter } from 'expo-router';

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background[theme] }}>
      <CustomHeader />
      <View style={styles.container}>
        <Text style={[styles.header, { color: colors.text[theme] }]}>Hotel Pre-booking</Text>

        <FlatList
          data={hotels}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <HotelCard
              hotel={item}
              onPress={() => router.push((`/hotels/details?hotel=${encodeURIComponent(JSON.stringify(item))}`) as any)}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 22, fontWeight: '700', padding: 16 },
});