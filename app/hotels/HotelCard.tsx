import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, SafeAreaView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';

type Props = { hotel: any; onPress?: () => void; showBottomWhite?: boolean };

export default function HotelCard({ hotel, onPress, showBottomWhite = false }: Props) {
  const { theme } = useTheme();
  const cardBg = colors.card[theme];
  const titleColor = colors.text[theme];
  const muted = colors.textMuted[theme];

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity style={styles.outer} onPress={onPress} activeOpacity={0.9}>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: colors.border[theme] }]}>
          <Image source={{ uri: hotel.image }} style={styles.image} />
          <View style={styles.info}>
            <Text style={[styles.name, { color: titleColor }]}>{hotel.name}</Text>
            <Text style={[styles.location, { color: muted }]}>{hotel.location}</Text>
            <Text style={[styles.price, { color: '#11A44A' }]}>${hotel.price} <Text style={[styles.perNight, { color: muted }]}>/ night</Text></Text>
            <View style={styles.metaRow}>
              <Text style={styles.star}>⭐</Text>
              <Text style={[styles.metaText, { color: muted }]}>{hotel.rating} | </Text>
              <Text style={[styles.metaText, { color: muted }]}>Discount: {hotel.discount}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {showBottomWhite ? <View style={styles.bottomWhite} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  outer: { marginBottom: 16 },
  card: { flexDirection: 'row', borderRadius: 14, backgroundColor: '#fff', padding: 12, alignItems: 'center', elevation: 3 },
  image: { width: 84, height: 84, borderRadius: 10, marginRight: 14 },
  info: { flex: 1 },
  name: { fontSize: 20, fontWeight: '800', marginBottom: 4, color: '#111' },
  location: { color: '#666', marginBottom: 6 },
  price: { color: '#11A44A', fontWeight: '800', fontSize: 16 },
  perNight: { color: '#666', fontWeight: '600', fontSize: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  star: { marginRight: 6 },
  metaText: { color: '#444', fontWeight: '600' },
  safeArea: { width: '100%' },
  bottomWhite: { height: 88, backgroundColor: '#fff', width: '100%', borderTopLeftRadius: 16, borderTopRightRadius: 16, marginTop: 8 },
});

