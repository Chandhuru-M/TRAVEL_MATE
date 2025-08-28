import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function Booking() {
  const { hotel } = useLocalSearchParams();
  const router = useRouter();
  const h = hotel ? JSON.parse(hotel as string) : null;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('1');
  const [rooms, setRooms] = useState('1');

  if (!h) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>No hotel selected</Text></View>;

  const handleProceed = () => {
    const qs = `hotel=${encodeURIComponent(JSON.stringify(h))}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}&guests=${encodeURIComponent(guests)}&rooms=${encodeURIComponent(rooms)}`;
    router.push((`/hotels/payment?${qs}`) as any);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 8 }}>Booking at {h.name}</Text>

      <Text style={{ marginTop: 8 }}>Full Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={{ marginTop: 8 }}>Email</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />

      <Text style={{ marginTop: 8 }}>Phone</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <Text style={{ marginTop: 8 }}>Check-In (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={checkIn} onChangeText={setCheckIn} />

      <Text style={{ marginTop: 8 }}>Check-Out (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={checkOut} onChangeText={setCheckOut} />

      <Text style={{ marginTop: 8 }}>Guests</Text>
      <TextInput style={styles.input} value={guests} onChangeText={setGuests} keyboardType="numeric" />

      <Text style={{ marginTop: 8 }}>Rooms</Text>
      <TextInput style={styles.input} value={rooms} onChangeText={setRooms} keyboardType="numeric" />

      <TouchableOpacity style={styles.nextButton} onPress={handleProceed}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Proceed to Payment</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({ input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginTop: 6 }, nextButton: { backgroundColor: '#007AFF', padding: 14, borderRadius: 10, marginTop: 20, alignItems: 'center' } });
