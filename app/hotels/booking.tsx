import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Platform, StatusBar, KeyboardAvoidingView } from 'react-native';
import KeyboardAwareScrollView from '@/utils/keyboardAware'
import useKeyboardVisible from '@/hooks/useKeyboardVisible'
import { Picker } from '@react-native-picker/picker';
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
  const [countryCode, setCountryCode] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showCheckOut, setShowCheckOut] = useState(false);
  const [checkInTime, setCheckInTime] = useState('12:00');
  const [checkOutTime, setCheckOutTime] = useState('12:00');
  const [showCheckInTime, setShowCheckInTime] = useState(false);
  const [showCheckOutTime, setShowCheckOutTime] = useState(false);
  const [guests, setGuests] = useState('1');
  const [rooms, setRooms] = useState('1');

  if (!h) return <View style={{flex:1,justifyContent:'center',alignItems:'center', backgroundColor: bg}}><Text style={{ color: textColor }}>No hotel selected</Text></View>;

  const handleProceed = () => {
    const qs = `hotel=${encodeURIComponent(JSON.stringify(h))}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(countryCode + phone)}&checkIn=${encodeURIComponent(checkIn + 'T' + checkInTime)}&checkOut=${encodeURIComponent(checkOut + 'T' + checkOutTime)}&guests=${encodeURIComponent(guests)}&rooms=${encodeURIComponent(rooms)}`;
    router.push((`/hotels/payment?${qs}`) as any);
  };
  const keyboardVisible = useKeyboardVisible()

  return (
  <SafeAreaView style={{ flex: 1, backgroundColor: bg, paddingTop: (Platform.OS as string) === 'android' ? StatusBar.currentHeight : 0 }}>
      <KeyboardAvoidingView behavior={(Platform.OS as string) === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <KeyboardAwareScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ padding: 16, flexGrow: 1 }} keyboardShouldPersistTaps="handled" enableOnAndroid enableAutomaticScroll>
        <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 8, color: textColor }}>Booking at {h.name}</Text>

      <Text style={{ marginTop: 8, color: textColor }}>Full Name</Text>
      <TextInput style={[styles.input, { backgroundColor: cardBg, color: textColor }]} value={name} onChangeText={setName} />

      <Text style={{ marginTop: 8, color: textColor }}>Email</Text>
      <TextInput style={[styles.input, { backgroundColor: cardBg, color: textColor }]} value={email} onChangeText={setEmail} keyboardType="email-address" />

      <Text style={{ marginTop: 8, color: textColor }}>Phone</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 0.7, marginRight: 8, borderRadius: 8, overflow: 'hidden', backgroundColor: cardBg }}>
          <Picker
            selectedValue={countryCode}
            onValueChange={setCountryCode}
            style={{ color: textColor, height: 48 }}
            dropdownIconColor={textColor}
          >
            <Picker.Item label="🇮🇳 +91" value="+91" />
            <Picker.Item label="🇺🇸 +1" value="+1" />
            <Picker.Item label="🇬🇧 +44" value="+44" />
            <Picker.Item label="🇦🇺 +61" value="+61" />
            <Picker.Item label="🇸🇬 +65" value="+65" />
            <Picker.Item label="🇦🇪 +971" value="+971" />
            <Picker.Item label="🇫🇷 +33" value="+33" />
            <Picker.Item label="🇩🇪 +49" value="+49" />
            <Picker.Item label="🇯🇵 +81" value="+81" />
            <Picker.Item label="Other" value="+" />
          </Picker>
        </View>
        <TextInput
          style={[styles.input, { backgroundColor: cardBg, color: textColor, flex: 1 }]}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>

      <Text style={{ marginTop: 8, color: textColor }}>Check-In</Text>
      <TouchableOpacity onPress={() => setShowCheckIn(true)} style={[styles.input, { backgroundColor: cardBg, justifyContent: 'center' }]}> 
        <Text style={{ color: checkIn ? textColor : '#888' }}>{checkIn || 'Select check-in date'}</Text>
      </TouchableOpacity>
      {showCheckIn && (
        <DateTimePicker
          value={checkIn ? new Date(checkIn) : new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()} // <-- Add this line
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

      <Text style={{ marginTop: 8, color: textColor }}>Check-In Time</Text>
      <TouchableOpacity onPress={() => setShowCheckInTime(true)} style={[styles.input, { backgroundColor: cardBg, justifyContent: 'center', marginTop: 6 }]}>
        <Text style={{ color: textColor }}>{checkInTime || 'Select check-in time'}</Text>
      </TouchableOpacity>
      {showCheckInTime && (
        <DateTimePicker
          value={new Date(`1970-01-01T${checkInTime}`)}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowCheckInTime(false);
            if (selectedTime) {
              const t = selectedTime.toTimeString().slice(0,5);
              setCheckInTime(t);
            }
          }}
        />
      )}

      <Text style={{ marginTop: 8, color: textColor }}>Check-Out Time</Text>
      <TouchableOpacity onPress={() => setShowCheckOutTime(true)} style={[styles.input, { backgroundColor: cardBg, justifyContent: 'center' }]}> 
        <Text style={{ color: checkOutTime ? textColor : '#888' }}>{checkOutTime || 'Select check-out time'}</Text>
      </TouchableOpacity>
      {showCheckOutTime && (
        <DateTimePicker
          value={new Date(`1970-01-01T${checkOutTime}:00`)}
          mode="time"
          display="default"
          onChange={(event, selectedDate) => {
            setShowCheckOutTime(false);
            if (selectedDate) {
              setCheckOutTime(selectedDate.toTimeString().split(' ')[0]);
            }
          }}
        />
      )}

      <Text style={{ marginTop: 8, color: textColor }}>Guests</Text>
      <TextInput style={[styles.input, { backgroundColor: cardBg, color: textColor }]} value={guests} onChangeText={setGuests} keyboardType="numeric" />

      <Text style={{ marginTop: 8, color: textColor }}>Rooms</Text>
      <TextInput style={[styles.input, { backgroundColor: cardBg, color: textColor }]} value={rooms} onChangeText={setRooms} keyboardType="numeric" />

        <View style={{ height: 20 }} />
        </KeyboardAwareScrollView>

        {!keyboardVisible && (
          <View style={styles.bottomWrap} pointerEvents="box-none">
            <TouchableOpacity style={[styles.nextButton, { marginBottom: (Platform.OS as string) === 'ios' ? 24 : 12 }]} onPress={handleProceed}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Proceed to Payment</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginTop: 6 },
  nextButton: { backgroundColor: '#007AFF', padding: 14, borderRadius: 10, marginTop: 20, alignItems: 'center', marginHorizontal: 16 },
  // Move the button up by 1 inch (about 24px)
  bottomWrap: { position: 'absolute', left: 0, right: 0, bottom: 24, alignItems: 'center', backgroundColor: 'transparent', paddingHorizontal: 16, paddingTop: 8 },
});
