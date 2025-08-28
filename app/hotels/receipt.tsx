import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as MailComposer from 'expo-mail-composer';

export default function Receipt() {
  const params = useLocalSearchParams();
  const h = params.hotel ? JSON.parse(params.hotel as string) : null;
  const name = params.name as string;
  const email = params.email as string;
  const checkIn = params.checkIn as string;
  const checkOut = params.checkOut as string;
  const guests = params.guests as string;
  const rooms = params.rooms as string;
  const nights = params.nights as string;
  const totalAmount = params.totalAmount as string;
  const discountPercent = params.discountPercent as string;
  const finalAmount = params.finalAmount as string;

  const sendEmail = async () => {
    await MailComposer.composeAsync({
      recipients: [email],
      subject: `Booking Receipt - ${h?.name}`,
      body: `Hi ${name}, your booking at ${h?.name} from ${checkIn} to ${checkOut} is confirmed. Total: ${finalAmount}`,
    });
    Alert.alert('Email Sent', 'Receipt sent to ' + email);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 12 }}>Booking Confirmed</Text>
      <View style={{ backgroundColor: '#fff', padding: 12, borderRadius: 10 }}>
        <Text>Hotel: {h?.name}</Text>
        <Text>Guest: {name}</Text>
        <Text>Check-In: {checkIn}</Text>
        <Text>Check-Out: {checkOut}</Text>
        <Text>Nights: {nights}</Text>
        <Text>Rooms: {rooms}</Text>
        <Text>Total: ${finalAmount}</Text>
      </View>

      <TouchableOpacity style={styles.emailButton} onPress={sendEmail}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Send Receipt to Email</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({ emailButton: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, marginTop: 16, alignItems: 'center' } });
