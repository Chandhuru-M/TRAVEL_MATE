// src/components/TransactionItem.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { useFinanceStore } from '@/services/financeService';
import { Transaction } from '@/lib/types';

export default function TransactionItem({ item }: { item: Transaction }) {
  const { theme } = useTheme();
  const { deleteTransaction } = useFinanceStore.getState(); // This will need to be created in financeService

  const formattedDate = new Date(item.timestamp).toLocaleString([], {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const handlePress = () => {
    Alert.alert(
      "Transaction Options",
      `What would you like to do with "${item.description}"?`,
      [
        { text: 'View Details', onPress: () => Alert.alert("Transaction Details", `Description: ${item.description}\nAmount: ₹${item.amount.toLocaleString()}\nDate: ${formattedDate}\nType: ${item.type}\nLinked to: ${item.trip_id || 'General Wallet'}`) },
        { text: 'Delete', style: 'destructive', onPress: () => Alert.alert("Delete Transaction", "Are you sure?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => deleteTransaction(item.id) }]) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <TouchableOpacity style={[styles.transactionItem, { backgroundColor: colors.card[theme] }]} onPress={handlePress}>
      <View style={styles.transactionDetails}>
        <Text style={[styles.transactionDescription, { color: colors.text[theme] }]}>{item.description}</Text>
        <Text style={[styles.transactionDate, { color: colors.textMuted[theme] }]}>{formattedDate}</Text>
      </View>
      <Text style={[styles.transactionAmount, { color: item.type === 'expense' ? '#ef4444' : '#22c55e' }]}>
        {item.type === 'expense' ? '-' : '+'}₹{item.amount.toLocaleString()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  transactionItem: { flexDirection: 'row', padding: 16, borderRadius: 8, marginBottom: 12, alignItems: 'center' },
  transactionDetails: { flex: 1 },
  transactionDescription: { fontWeight: '500', fontSize: 16 },
  transactionDate: { fontSize: 12, marginTop: 4 },
  transactionAmount: { fontWeight: 'bold', fontSize: 16 },
});