import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, sizes } from '../../constants';

// Define the shape of an action item
interface ActionItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  screen: any; // Expo Router path
}

const actions: ActionItem[] = [
  { icon: 'compass-outline', label: 'Explore', screen: '/explore' },
  { icon: 'bed-outline', label: 'Hotels', screen: '/explore' }, // Can be refined to go to explore with a filter
  { icon: 'map-outline', label: 'Map View', screen: '/map' },
  { icon: 'wallet-outline', label: 'Budget', screen: '/profile' }, // Assuming budget is on profile for now
];

const QuickAction: React.FC<{ item: ActionItem }> = ({ item }) => {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.actionItem} onPress={() => router.push(item.screen)}>
      <View style={styles.actionIconContainer}>
        <Ionicons name={item.icon} size={28} color={Colors.primary} />
      </View>
      <Text style={styles.actionLabel}>{item.label}</Text>
    </TouchableOpacity>
  );
};

const QuickActionsGrid: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.grid}>
        {actions.map((action) => (
          <QuickAction key={action.label} item={action} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: sizes.spacing.md,
  },
  sectionTitle: {
    fontSize: sizes.font.xl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: sizes.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  actionItem: {
    alignItems: 'center',
    width: '25%', // Allows for 4 items per row
    marginBottom: sizes.spacing.lg,
    paddingHorizontal: sizes.spacing.xs,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: sizes.borderRadius.lg,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: sizes.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  actionLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default QuickActionsGrid;