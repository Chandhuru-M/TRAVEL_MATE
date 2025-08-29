import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import HotelCard from './HotelCard';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';

const hotels = [
  { id: '1', name: 'Grand Palace', location: 'Chennai', price: 120, rating: 4.5, image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb', discount: '20%' },
  { id: '2', name: 'Beach Resort', location: 'Goa', price: 150, rating: 4.8, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', discount: '15%' },
  { id: '3', name: 'City Inn', location: 'Mumbai', price: 80, rating: 4.2, image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267', discount: '10%' },
];

export default function HotelsIndex() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background[theme] }]}>
      <FlatList
        data={hotels}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <HotelCard hotel={item} onPress={() => router.push((`/hotels/details?hotel=${encodeURIComponent(JSON.stringify(item))}`) as any)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 16 } });
