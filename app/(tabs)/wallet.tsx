// app/(tabs)/wallet.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomHeader from '@/components/CustomHeader';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { useFinanceStore } from '@/services/financeService';
import { Account } from '@/lib/types';
import { router } from 'expo-router';
import TransactionItem from '@/components/TransactionItem';

// --- ENHANCED, INTERACTIVE ACCOUNT CARD ---
const AccountCard = ({ item }: { item: Account }) => {
  const { theme } = useTheme();
  const { deleteAccount } = useFinanceStore.getState();

  const handlePress = () => {
    Alert.alert(
      item.name, // Use the account name as the title
      `Current Balance: ₹${item.balance.toLocaleString()}`, // Show balance in the message
      [
        {
          text: 'View Transactions',
          onPress: () => router.push('/transaction-history' as any), // Navigate to the full history
        },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              "Delete Account",
              `Are you sure you want to delete "${item.name}"? All associated transactions will also be deleted. This action cannot be undone.`,
              [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deleteAccount(item.id) }
              ]
            );
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card[theme] }]}
      onPress={handlePress}
    >
      <Text style={[styles.cardTitle, { color: colors.text[theme] }]}>{item.name}</Text>
      <Text style={[styles.cardBalance, { color: colors.text[theme] }]}>₹{item.balance.toLocaleString()}</Text>
    </TouchableOpacity>
  );
};
// --- END OF ACCOUNT CARD COMPONENT ---

export default function WalletScreen() {
  const { theme } = useTheme();
  const { accounts, transactions, isLoaded, fetchData } = useFinanceStore();
  console.log("Entered Wallet screen");
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const netWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  if (!isLoaded) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background[theme], justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary[theme]}/>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background[theme] }}>
      <CustomHeader />
      <ScrollView>
        <View style={styles.header}>
          <Text style={[styles.netWorthLabel, { color: colors.textMuted[theme] }]}>Net Worth</Text>
          <Text style={[styles.netWorthAmount, { color: colors.text[theme] }]}>₹{netWorth.toLocaleString()}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/create-account' as any)}>
              <Text style={styles.headerButtonText}>Add Account</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/add-transaction' as any)}>
              <Text style={styles.headerButtonText}>Add Transaction</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.listContainer}>
          <Text style={[styles.listHeader, { color: colors.text[theme] }]}>Your Accounts</Text>
          {accounts.length > 0 ? (
            accounts.map(item => <AccountCard key={item.id} item={item} />)
          ) : (
            <Text style={{ color: colors.textMuted[theme], textAlign: 'center', marginTop: 20 }}>
              No accounts yet. Tap 'Add Account' to get started.
            </Text>
          )}
        </View>

        <View style={styles.listContainer}>
          <View style={styles.listHeaderContainer}>
            <Text style={[styles.listHeader, { color: colors.text[theme] }]}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push('/transaction-history' as any)}>
              <Text style={{ color: colors.primary[theme] }}>View All</Text>
            </TouchableOpacity>
          </View>
          {transactions.slice(0, 5).length > 0 ? (
            transactions.slice(0, 5).map(item => <TransactionItem key={item.id} item={item} />)
          ) : (
            <Text style={{ color: colors.textMuted[theme], textAlign: 'center', marginTop: 20 }}>
              No recent transactions.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#334155' },
  netWorthLabel: { fontSize: 16 },
  netWorthAmount: { fontSize: 40, fontWeight: 'bold' },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  headerButton: { backgroundColor: '#2563eb', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  headerButtonText: { color: 'white', fontWeight: 'bold' },
  listContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  listHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listHeader: { fontSize: 18, fontWeight: 'bold' },
  card: { padding: 20, borderRadius: 12, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardBalance: { fontSize: 24, marginTop: 4, fontWeight: '600' },
});