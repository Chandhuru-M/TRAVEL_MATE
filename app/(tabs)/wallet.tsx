import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import CustomHeader from '@/components/CustomHeader';

export default function WalletScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <CustomHeader />
        <View style={styles.content}>
          <FontAwesome name="google-wallet" size={80} color="#64748b" />
          <Text style={styles.title}>My Wallet</Text>
          <Text style={styles.subtitle}>The wallet and payment integration will be here.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'black' },
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginTop: 20 },
  subtitle: { fontSize: 16, color: '#94a3b8', marginTop: 8, textAlign: 'center' },
});