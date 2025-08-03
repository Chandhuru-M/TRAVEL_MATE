import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, sizes } from '../../constants';

interface BudgetProgressChartProps {
  totalBudget: number;
  amountSpent: number;
}

const BudgetProgressChart: React.FC<BudgetProgressChartProps> = ({ totalBudget, amountSpent }) => {
  // Ensure we don't divide by zero and cap the progress at 100%
  const progress = totalBudget > 0 ? Math.min((amountSpent / totalBudget) * 100, 100) : 0;
  const amountRemaining = totalBudget - amountSpent;

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Budget Overview</Text>
        <Text style={styles.totalBudget}>Total: {formatCurrency(totalBudget)}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
      </View>

      {/* Spending Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Spent</Text>
          <Text style={[styles.detailValue, styles.spentValue]}>{formatCurrency(amountSpent)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Remaining</Text>
          <Text style={[styles.detailValue, styles.remainingValue]}>{formatCurrency(amountRemaining)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: sizes.borderRadius.lg,
    padding: sizes.spacing.lg,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: sizes.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: sizes.spacing.md,
  },
  title: {
    fontSize: sizes.font.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  totalBudget: {
    fontSize: sizes.font.sm,
    color: Colors.textSecondary,
  },
  progressBarBackground: {
    height: 10,
    width: '100%',
    backgroundColor: '#E9E9EB',
    borderRadius: sizes.borderRadius.full,
    overflow: 'hidden',
    marginVertical: sizes.spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: sizes.borderRadius.full,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: sizes.spacing.md,
  },
  detailItem: {
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: sizes.font.sm,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: sizes.font.md,
    fontWeight: 'bold',
  },
  spentValue: {
    color: Colors.danger,
  },
  remainingValue: {
    color: Colors.success,
  },
});

export default BudgetProgressChart;