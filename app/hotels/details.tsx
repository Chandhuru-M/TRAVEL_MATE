import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';

export default function HotelDetails() {
  const { hotel } = useLocalSearchParams();
  const router = useRouter();
  const h = hotel ? JSON.parse(hotel as string) : null;
  const { theme } = useTheme();

  const bg = colors.background[theme];
  const textColor = colors.text[theme];
  const muted = colors.textMuted[theme];

  if (!h) return <View style={{flex:1,justifyContent:'center',alignItems:'center', backgroundColor: bg }}><Text style={{ color: textColor }}>No hotel data</Text></View>;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView>
        <Image source={{ uri: h.image }} style={{ width: '100%', height: 240 }} />
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: textColor }}>{h.name}</Text>
          <Text style={{ color: muted, marginVertical: 6 }}>{h.location}</Text>
          <Text style={{ marginBottom: 12, color: muted }}>⭐ {h.rating} | {h.discount} off</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: textColor }}>${h.price} / night</Text>
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
