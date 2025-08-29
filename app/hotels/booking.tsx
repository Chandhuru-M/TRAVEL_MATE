import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';

export default function Booking() {
  const { hotel } = useLocalSearchParams();
  const router = useRouter();
  const h = hotel ? JSON.parse(hotel as string) : null;
  const { theme } = useTheme();
  const bg = colors.background[theme];
  const textColor = colors.text[theme];
  const cardBg = colors.card[theme];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showCheckOut, setShowCheckOut] = useState(false);
  const [guests, setGuests] = useState('1');
  const [rooms, setRooms] = useState('1');

  if (!h) return <View style={{flex:1,justifyContent:'center',alignItems:'center', backgroundColor: bg}}><Text style={{ color: textColor }}>No hotel selected</Text></View>;

  const handleProceed = () => {
    const qs = `hotel=${encodeURIComponent(JSON.stringify(h))}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}&guests=${encodeURIComponent(guests)}&rooms=${encodeURIComponent(rooms)}`;
    router.push((`/hotels/payment?${qs}`) as any);
  };

  return (
  <SafeAreaView style={{ flex: 1, backgroundColor: bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ padding: 16, flexGrow: 1 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 8, color: textColor }}>Booking at {h.name}</Text>

      <Text style={{ marginTop: 8, color: textColor }}>Full Name</Text>
      <TextInput style={[styles.input, { backgroundColor: cardBg, color: textColor }]} value={name} onChangeText={setName} />

      <Text style={{ marginTop: 8, color: textColor }}>Email</Text>
      <TextInput style={[styles.input, { backgroundColor: cardBg, color: textColor }]} value={email} onChangeText={setEmail} keyboardType="email-address" />

      <Text style={{ marginTop: 8, color: textColor }}>Phone</Text>
      <TextInput style={[styles.input, { backgroundColor: cardBg, color: textColor }]} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />


      <Text style={{ marginTop: 8, color: textColor }}>Check-In</Text>
      <TouchableOpacity onPress={() => setShowCheckIn(true)} style={[styles.input, { backgroundColor: cardBg, justifyContent: 'center' }]}> 
        <Text style={{ color: checkIn ? textColor : '#888' }}>{checkIn || 'Select check-in date'}</Text>
      </TouchableOpacity>
      {showCheckIn && (
        <DateTimePicker
          value={checkIn ? new Date(checkIn) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowCheckIn(false);
            if (selectedDate) {
              setCheckIn(selectedDate.toISOString().split('T')[0]);
            }
          }}
        />
      )}

      <Text style={{ marginTop: 8, color: textColor }}>Check-Out</Text>
      <TouchableOpacity onPress={() => setShowCheckOut(true)} style={[styles.input, { backgroundColor: cardBg, justifyContent: 'center' }]}> 
        <Text style={{ color: checkOut ? textColor : '#888' }}>{checkOut || 'Select check-out date'}</Text>
      </TouchableOpacity>
      {showCheckOut && (
        <DateTimePicker
          value={checkOut ? new Date(checkOut) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowCheckOut(false);
            if (selectedDate) {
              setCheckOut(selectedDate.toISOString().split('T')[0]);
            }
          }}
        />
      )}

      <Text style={{ marginTop: 8, color: textColor }}>Guests</Text>
      <TextInput style={[styles.input, { backgroundColor: cardBg, color: textColor }]} value={guests} onChangeText={setGuests} keyboardType="numeric" />

      <Text style={{ marginTop: 8, color: textColor }}>Rooms</Text>
      <TextInput style={[styles.input, { backgroundColor: cardBg, color: textColor }]} value={rooms} onChangeText={setRooms} keyboardType="numeric" />

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={styles.bottomWrap} pointerEvents="box-none">
        <TouchableOpacity style={[styles.nextButton, { marginBottom: Platform.OS === 'ios' ? 24 : 12 }]} onPress={handleProceed}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Proceed to Payment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginTop: 6 },
  nextButton: { backgroundColor: '#007AFF', padding: 14, borderRadius: 10, marginTop: 20, alignItems: 'center', marginHorizontal: 16 },
  // Move the button up by 1 inch (about 24px)
  bottomWrap: { position: 'absolute', left: 0, right: 0, bottom: 24, alignItems: 'center', backgroundColor: 'transparent', paddingHorizontal: 16, paddingTop: 8 },
});
