import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';

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

  const { theme } = useTheme();
  const bg = colors.background[theme];
  const textColor = colors.text[theme];

  if (!h) return <View style={{flex:1,justifyContent:'center',alignItems:'center', backgroundColor: bg}}><Text style={{ color: textColor }}>No booking data</Text></View>;

  const nights = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000*60*60*24)));
  const total = h.price * rooms * nights;

  const handlePay = () => {
    const qs = `hotel=${encodeURIComponent(JSON.stringify(h))}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}&guests=${encodeURIComponent(guests)}&rooms=${encodeURIComponent(String(rooms))}&nights=${encodeURIComponent(String(nights))}&totalAmount=${encodeURIComponent(String(total))}&discountPercent=${encodeURIComponent(h.discount || '0')}&finalAmount=${encodeURIComponent(String(total))}`;
    router.push((`/hotels/receipt?${qs}`) as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg, paddingTop: (Platform.OS as string) === 'android' ? StatusBar.currentHeight : 0 }}>
      <View style={[styles.centeredContainer, { backgroundColor: bg }]}> 
        <Text style={{ fontSize: 24, fontWeight: '700', color: textColor, marginBottom: 20 }}>Payment</Text>
        <View style={{ marginBottom: 24, alignItems: 'center' }}>
          <Text style={{ color: textColor, fontSize: 18, marginBottom: 4 }}>Hotel: {h.name}</Text>
          <Text style={{ color: textColor, fontSize: 16, marginBottom: 4 }}>Guest: {name}</Text>
          <Text style={{ color: textColor, fontSize: 16, marginBottom: 4 }}>Nights: {nights}</Text>
          <Text style={{ color: textColor, fontSize: 16, marginBottom: 4 }}>Total: ${total}</Text>
        </View>
        <TouchableOpacity style={styles.payButton} onPress={handlePay}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>Pay Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  payButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
    minWidth: 280,
    marginBottom: 0,
  },
});
