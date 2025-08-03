import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, sizes } from '../../constants';
import Card from '../common/Card'; // Reusing the common Card component

interface BudgetSummaryProps {
  amountSpent?: number;
  totalBudget?: number;
}

const BudgetSummary: React.FC<BudgetSummaryProps> = ({ amountSpent = 450, totalBudget = 1500 }) => {
  const progress = totalBudget > 0 ? (amountSpent / totalBudget) * 100 : 0;
  const isConnected = totalBudget > 0;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="wallet-outline" size={24} color={Colors.primary} />
        <Text style={styles.title}>Budget Summary</Text>
      </View>

      {isConnected ? (
        <>
          <View style={styles.budgetInfo}>
            <Text style={styles.amountSpent}>${amountSpent.toFixed(2)}</Text>
            <Text style={styles.totalBudget}> of ${totalBudget.toFixed(2)}</Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
        </>
      ) : (
        <View style={styles.connectContainer}>
          <Text style={styles.connectText}>Connect your wallet to track spending.</Text>
          <TouchableOpacity style={styles.connectButton}>
            <Text style={styles.connectButtonText}>Connect Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: sizes.spacing.md,
  },
  title: {
    fontSize: sizes.font.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginLeft: sizes.spacing.sm,
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  amountSpent: {
    fontSize: sizes.font.xl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  totalBudget: {
    fontSize: sizes.font.sm,
    color: Colors.textSecondary,
    marginLeft: sizes.spacing.xs,
    marginBottom: 4,
  },
  progressBarBackground: {
    height: 8,
    width: '100%',
    backgroundColor: '#E9E9EB',
    borderRadius: sizes.borderRadius.full,
    overflow: 'hidden',
    marginTop: sizes.spacing.md,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: sizes.borderRadius.full,
  },
  connectContainer: {
    alignItems: 'center',
    paddingVertical: sizes.spacing.md,
  },
  connectText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: sizes.spacing.md,
  },
  connectButton: {
    backgroundColor: `${Colors.primary}20`, // Light primary color
    paddingVertical: sizes.spacing.sm,
    paddingHorizontal: sizes.spacing.lg,
    borderRadius: sizes.borderRadius.full,
  },
  connectButtonText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
});

export default BudgetSummary;