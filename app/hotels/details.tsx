import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function HotelDetails() {
  const { hotel } = useLocalSearchParams();
  const router = useRouter();
  const h = hotel ? JSON.parse(hotel as string) : null;

  if (!h) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>No hotel data</Text></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView>
        <Image source={{ uri: h.image }} style={{ width: '100%', height: 240 }} />
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: '700' }}>{h.name}</Text>
          <Text style={{ color: 'gray', marginVertical: 6 }}>{h.location}</Text>
          <Text style={{ marginBottom: 12 }}>⭐ {h.rating} | {h.discount} off</Text>
          <Text style={{ fontSize: 16, fontWeight: '600' }}>${h.price} / night</Text>
        </View>
      </ScrollView>

        <View style={{ padding: 16 }}>
        <TouchableOpacity style={styles.bookButton} onPress={() => router.push((`/hotels/booking?hotel=${encodeURIComponent(JSON.stringify(h))}`) as any)}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ bookButton: { backgroundColor: '#2a9d8f', padding: 14, borderRadius: 10, alignItems: 'center' } });
