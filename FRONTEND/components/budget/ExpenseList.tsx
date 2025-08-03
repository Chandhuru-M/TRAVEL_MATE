import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Colors, sizes } from '../../constants';
import Card from '../common/Card'; // Reusing our common Card component

interface Expense {
  id: string;
  name: string;
  category: 'Food' | 'Transport' | 'Lodging' | 'Other';
  amount: number;
}

interface ExpenseListProps {
  expenses: Expense[];
}

const ExpenseItem: React.FC<{ item: Expense }> = ({ item }) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Food':
        return 'fast-food-outline';
      case 'Transport':
        return 'car-sport-outline';
      case 'Lodging':
        return 'bed-outline';
      default:
        return 'receipt-outline';
    }
  };

  return (
    <View style={styles.itemContainer}>
      <View style={[styles.iconContainer, { backgroundColor: `${Colors.primary}20` }]}>
        <Ionicons name={getCategoryIcon(item.category)} size={24} color={Colors.primary} />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemCategory}>{item.category}</Text>
      </View>
      <Text style={styles.itemAmount}>-${item.amount.toFixed(2)}</Text>
    </View>
  );
};

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses }) => {
  return (
    <Card style={{ padding: 0 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Expenses</Text>
      </View>
      <FlatList
        data={expenses}
        renderItem={({ item }) => <ExpenseItem item={item} />}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No expenses recorded yet.</Text>}
        scrollEnabled={false} // Let the parent ScrollView handle scrolling
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: sizes.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: sizes.font.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sizes.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: sizes.spacing.md,
  },
  infoContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: sizes.font.md,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  itemCategory: {
    fontSize: sizes.font.sm,
    color: Colors.textSecondary,
  },
  itemAmount: {
    fontSize: sizes.font.md,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  emptyText: {
    textAlign: 'center',
    padding: sizes.spacing.lg,
    color: Colors.textSecondary,
  },
});

export default ExpenseList;