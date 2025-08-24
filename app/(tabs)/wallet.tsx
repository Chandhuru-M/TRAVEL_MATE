// app/(tabs)/wallet.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import CustomHeader from '@/components/CustomHeader';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { useFinanceStore } from '@/services/financeService';
import { Account } from '@/lib/types';
import { router } from 'expo-router';

const AccountCard = ({ item }: { item: Account }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card[theme] }]}>
      <Text style={[styles.cardTitle, { color: colors.text[theme] }]}>{item.name}</Text>
      <Text style={[styles.cardBalance, { color: colors.text[theme] }]}>₹{item.balance.toLocaleString()}</Text>
    </View>
  );
};

export default function WalletScreen() {
  const { theme } = useTheme();
  const { accounts, isLoaded, fetchData } = useFinanceStore();

  useEffect(() => {
    fetchData();
  }, []);

  const netWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  if (!isLoaded) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background[theme], justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background[theme] }}>
      <CustomHeader />
      <View style={styles.header}>
        <Text style={[styles.netWorthLabel, { color: colors.textMuted[theme] }]}>Net Worth</Text>
        <Text style={[styles.netWorthAmount, { color: colors.text[theme] }]}>₹{netWorth.toLocaleString()}</Text>
      </View>
      <FlatList
        data={accounts}
        renderItem={({ item }) => <AccountCard item={item} />}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<Text style={[styles.listHeader, { color: colors.text[theme] }]}>Your Accounts</Text>}
        contentContainerStyle={styles.list}
      />
      {/* We need a new Add Transaction button and screen */}
      <TouchableOpacity style={styles.addButton} onPress={() => router.push('/add-transaction')}>
        <Text style={styles.addButtonText}>Add Transaction</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', padding: 20 },
  netWorthLabel: { fontSize: 16 },
  netWorthAmount: { fontSize: 40, fontWeight: 'bold' },
  list: { paddingHorizontal: 16 },
  listHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  card: { padding: 20, borderRadius: 12, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardBalance: { fontSize: 24, marginTop: 4 },
  addButton: { backgroundColor: '#2563eb', padding: 16, margin: 16, borderRadius: 8, alignItems: 'center' },
  addButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});