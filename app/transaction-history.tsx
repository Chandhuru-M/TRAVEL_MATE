// app/transaction-history.tsx
import React from 'react';
import { StyleSheet, SafeAreaView, FlatList, Text } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { useFinanceStore } from '@/services/financeService';
import TransactionItem from '@/components/TransactionItem'; // Import our reusable component

export default function TransactionHistoryScreen() {
  const { theme } = useTheme();
  const { transactions } = useFinanceStore();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background[theme] }}>
      <FlatList
        data={transactions}
        renderItem={({ item }) => <TransactionItem item={item} />}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={{ color: colors.textMuted[theme], textAlign: 'center', marginTop: 40 }}>No transactions yet.</Text>}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
});