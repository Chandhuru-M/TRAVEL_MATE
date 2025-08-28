import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HotelCard({ hotel, onPress }: { hotel: any; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={{ uri: hotel.image }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name}>{hotel.name}</Text>
        <Text>{hotel.location}</Text>
        <Text style={styles.price}>${hotel.price} / night</Text>
        <Text>⭐ {hotel.rating} | Discount: {hotel.discount}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', marginBottom: 12, borderRadius: 8, backgroundColor: '#fff', padding: 10 },
  image: { width: 80, height: 80, borderRadius: 8, marginRight: 10 },
  info: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: 'bold' },
  price: { color: '#4CAF50', fontWeight: 'bold' },
});
