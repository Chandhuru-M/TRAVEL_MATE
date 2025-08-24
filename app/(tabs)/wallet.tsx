// app/(tabs)/wallet.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import CustomHeader from '@/components/CustomHeader';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { useWalletStore } from '@/services/walletService';
import { Transaction } from '@/lib/types';
import { router } from 'expo-router';
import EditBalanceModal from '@/components/EditBalanceModal';
import InitialBalanceModal from '@/components/InitialBalanceModal';

const TransactionItem = ({ item }: { item: Transaction }) => {
  const { theme } = useTheme();
  const { deleteTransaction } = useWalletStore.getState();

  const formattedDate = new Date(item.timestamp).toLocaleString([], {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const handlePress = () => {
    Alert.alert(
      "Transaction Options",
      `What would you like to do with "${item.description}"?`,
      [
        {
          text: 'View Details',
          onPress: () => Alert.alert(
            "Transaction Details",
            `Description: ${item.description}\nAmount: ₹${item.amount.toLocaleString()}\nDate: ${formattedDate}\nType: ${item.type}\nLinked to: ${item.tripId === 'wallet' ? 'General Wallet' : 'Trip'}`
          ),
        },
        {
          text: 'Delete',
          onPress: () => Alert.alert(
            "Delete Transaction",
            "Are you sure you want to delete this transaction?",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => deleteTransaction(item.id) }
            ]
          ),
          style: 'destructive',
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.transactionItem, { backgroundColor: colors.card[theme] }]}
      onPress={handlePress}
    >
      <View style={styles.transactionDetails}>
        <Text style={[styles.transactionDescription, { color: colors.text[theme] }]}>{item.description}</Text>
        <Text style={[styles.transactionDate, { color: colors.textMuted[theme] }]}>{formattedDate}</Text>
      </View>
      <Text style={[styles.transactionAmount, { color: item.type === 'debit' ? '#ef4444' : '#22c55e' }]}>
        {item.type === 'debit' ? '-' : '+'}₹{item.amount.toLocaleString()}
      </Text>
    </TouchableOpacity>
  );
};

export default function WalletScreen() {
  const { theme } = useTheme();
  const { balance, transactions, isLoaded, isNewUserWallet } = useWalletStore();
  const { setBalance, initializeWallet, fetchWalletData } = useWalletStore.getState();

  const [showTransactions, setShowTransactions] = useState(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  // This is the safe data fetching logic. It runs only when the screen is first displayed.
  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const handleSaveInitialBalance = async (balanceText: string) => {
    const initialBalance = parseFloat(balanceText);
    if (!isNaN(initialBalance) && initialBalance >= 0) {
      await initializeWallet(initialBalance);
    } else {
      Alert.alert("Invalid Input", "Please enter a valid positive number.");
    }
  };

  const handleSaveBalance = (newBalanceText: string) => {
    const newBalance = parseFloat(newBalanceText);
    if (!isNaN(newBalance) && newBalance >= 0) {
      setBalance(newBalance);
      setIsEditModalVisible(false);
    } else {
      Alert.alert("Invalid Input", "Please enter a valid positive number.");
    }
  };

  if (!isLoaded) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background[theme], justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary[theme]} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background[theme] }}>
      <CustomHeader />
      
      {!isNewUserWallet && (
        <>
          <View style={styles.header}>
            <Text style={[styles.balanceLabel, { color: colors.textMuted[theme] }]}>Total Balance</Text>
            <TouchableOpacity style={styles.balanceContainer} onPress={() => setIsEditModalVisible(true)}>
              <Text style={[styles.balanceAmount, { color: colors.text[theme] }]}>₹{balance.toLocaleString()}</Text>
              <FontAwesome name="pencil" size={20} color={colors.textMuted[theme]} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push('/add-transaction')}>
              <Text style={styles.addButtonText}>Add Transaction</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listHeaderContainer}>
            <Text style={[styles.listHeader, { color: colors.text[theme] }]}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => setShowTransactions(!showTransactions)}>
              <FontAwesome name={showTransactions ? "eye-slash" : "eye"} size={20} color={colors.textMuted[theme]} />
            </TouchableOpacity>
          </View>

          {showTransactions && (
            <FlatList
              data={transactions}
              renderItem={({ item }) => <TransactionItem item={item} />}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <Text style={{ color: colors.textMuted[theme], textAlign: 'center', marginTop: 40 }}>
                  No transactions yet.
                </Text>
              }
              contentContainerStyle={styles.list}
            />
          )}
        </>
      )}

      <EditBalanceModal
        isVisible={isEditModalVisible}
        currentBalance={balance}
        onClose={() => setIsEditModalVisible(false)}
        onSave={handleSaveBalance}
      />
      
      <InitialBalanceModal
        isVisible={isNewUserWallet}
        onSave={handleSaveInitialBalance}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#334155' },
  balanceLabel: { fontSize: 16 },
  balanceContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8 },
  balanceAmount: { fontSize: 40, fontWeight: 'bold' },
  addButton: { backgroundColor: '#2563eb', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginTop: 12 },
  addButtonText: { color: 'white', fontWeight: 'bold' },
  list: { paddingHorizontal: 16 },
  listHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  listHeader: { fontSize: 18, fontWeight: 'bold' },
  transactionItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontWeight: '500',
    fontSize: 16,
  },
  transactionDate: {
    fontSize: 12,
    marginTop: 4,
  },
  transactionAmount: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});