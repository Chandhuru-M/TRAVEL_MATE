import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as MailComposer from 'expo-mail-composer';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';

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

  const { theme } = useTheme();
  const bg = colors.background[theme];
  const cardBg = colors.card[theme];
  const textColor = colors.text[theme];
  const muted = colors.textMuted[theme];
  const primary = colors.primary[theme];

  const sendEmail = async () => {
    await MailComposer.composeAsync({
      recipients: [email],
      subject: `Booking Receipt - ${h?.name}`,
      body: `Hi ${name}, your booking at ${h?.name} from ${checkIn} to ${checkOut} is confirmed. Total: ${finalAmount}`,
    });
    Alert.alert('Email Sent', 'Receipt sent to ' + email);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg, paddingTop: (Platform.OS as string) === 'android' ? StatusBar.currentHeight : 0 }}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: bg }]}>
        <Text style={[styles.title, { color: textColor }]}>Booking Confirmed</Text>

        <View style={[styles.card, { backgroundColor: cardBg, borderColor: colors.border[theme] }]}>
          <Text style={[styles.fieldLabel, { color: muted }]}>Hotel</Text>
          <Text style={[styles.fieldValue, { color: textColor }]}>{h?.name}</Text>

          <Text style={[styles.fieldLabel, { color: muted }]}>Guest</Text>
          <Text style={[styles.fieldValue, { color: textColor }]}>{name}</Text>

          <Text style={[styles.fieldLabel, { color: muted }]}>Check-In</Text>
          <Text style={[styles.fieldValue, { color: textColor }]}>{checkIn}</Text>

          <Text style={[styles.fieldLabel, { color: muted }]}>Check-Out</Text>
          <Text style={[styles.fieldValue, { color: textColor }]}>{checkOut}</Text>

          <Text style={[styles.fieldLabel, { color: muted }]}>Nights</Text>
          <Text style={[styles.fieldValue, { color: textColor }]}>{nights}</Text>

          <Text style={[styles.fieldLabel, { color: muted }]}>Rooms</Text>
          <Text style={[styles.fieldValue, { color: textColor }]}>{rooms}</Text>

          <Text style={[styles.fieldLabel, { color: muted }]}>Total</Text>
          <Text style={[styles.fieldValue, { color: textColor }]}>${finalAmount}</Text>
        </View>

        <TouchableOpacity style={[styles.emailButton, { backgroundColor: primary }]} onPress={sendEmail}>
          <Text style={[styles.emailButtonText]}>Send Receipt to Email</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flexGrow: 1 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  card: { padding: 12, borderRadius: 10, marginBottom: 16, borderWidth: 1 },
  fieldLabel: { fontSize: 12, marginTop: 8 },
  fieldValue: { fontSize: 16, fontWeight: '600' },
  emailButton: { padding: 12, borderRadius: 8, marginTop: 8, alignItems: 'center' },
  emailButtonText: { color: '#fff', fontWeight: '700' },
});
