import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, sizes } from '../../constants';

interface Alert {
  id: string;
  title: string;
  subtitle: string;
  severity: 'low' | 'medium' | 'high';
}

const DUMMY_ALERTS: Alert[] = [
  { id: '1', title: 'High Crime Area', subtitle: '0.3 miles north - Increased theft reports', severity: 'high' },
  { id: '2', title: 'Construction Zone', subtitle: '0.8 miles east - Medium delay expected', severity: 'medium' },
  { id: '3', title: 'Weather Warning', subtitle: 'Heavy rain forecast for 3 PM', severity: 'high' },
];

const AlertItem: React.FC<{ item: Alert }> = ({ item }) => {
  const getSeverityStyle = () => {
    switch (item.severity) {
      case 'high':
        return { borderColor: Colors.danger, icon: 'warning', iconColor: Colors.danger };
      case 'medium':
        return { borderColor: Colors.warning, icon: 'build', iconColor: Colors.warning };
      default:
        return { borderColor: Colors.success, icon: 'shield-checkmark', iconColor: Colors.success };
    }
  };

  const { borderColor, icon, iconColor } = getSeverityStyle();

  return (
    <View style={[styles.alertCard, { borderLeftColor: borderColor }]}>
      <Ionicons name={icon as any} size={24} color={iconColor} style={styles.alertIcon} />
      <View style={styles.alertTextContainer}>
        <Text style={styles.alertTitle}>{item.title}</Text>
        <Text style={styles.alertSubtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );
};

const SafetyAlertsPreview: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Safety & Alerts</Text>
      {DUMMY_ALERTS.map(alert => (
        <AlertItem key={alert.id} item={alert} />
      ))}
      <TouchableOpacity style={styles.viewAllButton}>
        <Text style={styles.viewAllText}>View All Alerts</Text>
      </TouchableOpacity>
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
  alertCard: {
    backgroundColor: Colors.white,
    borderRadius: sizes.borderRadius.md,
    padding: sizes.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: sizes.spacing.sm,
    borderLeftWidth: 5,
  },
  alertIcon: {
    marginRight: sizes.spacing.md,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontWeight: 'bold',
    color: Colors.textPrimary,
    fontSize: 15,
  },
  alertSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  viewAllButton: {
    alignSelf: 'center',
    marginTop: sizes.spacing.sm,
  },
  viewAllText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default SafetyAlertsPreview;```