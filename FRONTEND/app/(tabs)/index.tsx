import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// FIX: Corrected the import path
// import { Colors, sizes } from '@/constants';
import { Colors, sizes } from '@/constants';
import { useAuth } from '@/hooks/useAuth';

// --- Components (can be moved to their own files later) ---
const QuickAction = ({ icon, label, screen }: { icon: any; label: string; screen: any }) => {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.actionItem} onPress={() => router.push(screen)}>
      <View style={styles.actionIconContainer}>
        <Ionicons name={icon} size={28} color={Colors.light.primary} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

// --- Main Screen Component ---
const HomeScreen = () => {
  const { user } = useAuth();
  const userName = user?.name || "Wanderer";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Header */}
        <View style={styles.header}>
            <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.userName}>{userName}</Text>
            </View>
            <Image
            source={{ uri: `https://i.pravatar.cc/150?u=${user?.email}` }}
            style={styles.avatar}
            />
        </View>

        {/* AI Prompt Card */}
        <Link href="/chat" asChild>
          <TouchableOpacity style={styles.aiCard}>
            <Ionicons name="sparkles" size={32} color={Colors.light.accent} />
            <View style={styles.aiCardTextContainer}>
              <Text style={styles.aiCardTitle}>Talk to your AI Assistant</Text>
              <Text style={styles.aiCardSubtitle}>Plan trips, find places, and more</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={'rgba(255, 255, 255, 0.7)'} />
          </TouchableOpacity>
        </Link>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <QuickAction icon="compass-outline" label="Explore" screen="/explore" />
            <QuickAction icon="bed-outline" label="Hotels" screen="/explore" />
            <QuickAction icon="map-outline" label="Map View" screen="/map" />
            <QuickAction icon="wallet-outline"label="Budget" screen="/profile"/>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContainer: {
    padding: sizes.spacing.md,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: sizes.spacing.lg,
  },
  greeting: {
    fontSize: sizes.font.md,
    color: Colors.light.textSecondary,
  },
  userName: {
    fontSize: sizes.font.xxl,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  aiCard: {
    backgroundColor: '#4A42A3', // primaryDark
    borderRadius: sizes.borderRadius.lg,
    padding: sizes.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: sizes.spacing.xl,
  },
  aiCardTextContainer: {
    flex: 1,
    marginLeft: sizes.spacing.md,
  },
  aiCardTitle: {
    color: Colors.light.cardBackground,
    fontSize: sizes.font.lg,
    fontWeight: 'bold',
  },
  aiCardSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: sizes.font.sm,
  },
  section: {
    marginBottom: sizes.spacing.xl,
  },
  sectionTitle: {
    fontSize: sizes.font.xl,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: sizes.spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  actionItem: {
    alignItems: 'center',
    width: '25%',
    marginBottom: sizes.spacing.md,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: sizes.borderRadius.md,
    backgroundColor: Colors.light.cardBackground,
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
    fontSize: sizes.font.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});

export default HomeScreen;