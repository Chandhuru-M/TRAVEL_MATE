import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function Payment() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const h = params.hotel ? JSON.parse(params.hotel as string) : null;
  const name = params.name as string;
  const email = params.email as string;
  const checkIn = params.checkIn as string;
  const checkOut = params.checkOut as string;
  const guests = params.guests as string;
  const rooms = parseInt(params.rooms as string || '1', 10);

  if (!h) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>No booking data</Text></View>;

  const nights = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000*60*60*24)));
  const total = h.price * rooms * nights;

  const handlePay = () => {
    const qs = `hotel=${encodeURIComponent(JSON.stringify(h))}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}&guests=${encodeURIComponent(guests)}&rooms=${encodeURIComponent(String(rooms))}&nights=${encodeURIComponent(String(nights))}&totalAmount=${encodeURIComponent(String(total))}&discountPercent=${encodeURIComponent(h.discount || '0')}&finalAmount=${encodeURIComponent(String(total))}`;
    router.push((`/hotels/receipt?${qs}`) as any);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>Payment</Text>
      <View style={{ marginTop: 12 }}>
        <Text>Hotel: {h.name}</Text>
        <Text>Guest: {name}</Text>
        <Text>Nights: {nights}</Text>
        <Text>Total: ${total}</Text>
      </View>

      <TouchableOpacity style={styles.payButton} onPress={handlePay}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Pay Now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({ payButton: { backgroundColor: '#007AFF', padding: 14, borderRadius: 10, marginTop: 20, alignItems: 'center' } });
