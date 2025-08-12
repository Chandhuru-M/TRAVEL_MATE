import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, sizes } from '@/constants';
import { useAuth } from '@/hooks/useAuth';

// --- Reusable Option Component ---
const ProfileOption = ({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.option} onPress={onPress}>
    <Ionicons name={icon} size={24} color={Colors.light.primary} />
    <Text style={styles.optionLabel}>{label}</Text>
    <Ionicons name="chevron-forward" size={24} color={Colors.light.textSecondary} />
  </TouchableOpacity>
);

// --- Reusable Header Component ---
const UserProfileHeader = ({ name, email }: { name: string; email: string }) => (
  <View style={styles.profileHeader}>
    <Image
      source={{ uri: `https://i.pravatar.cc/300?u=${email}` }}
      style={styles.avatar}
    />
    <Text style={styles.userName}>{name}</Text>
    <Text style={styles.userEmail}>{email}</Text>
  </View>
);

// --- Main Screen Component ---
const ProfileScreen = () => {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // The useProtectedRoute hook in AuthContext should handle this automatically
      router.replace('/sign-in');
    } catch (error) {
      Alert.alert("Logout Failed", "An error occurred while logging out.");
    }
  };

  if (!user) {
    // This can be a loading state or null if AuthContext handles redirection.
    return null;
  }

  // Get user name from user metadata or email
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>My Profile</Text>

        <UserProfileHeader name={userName} email={user.email || ''} />

        <View style={styles.optionsContainer}>
          <ProfileOption icon="person-circle-outline" label="Account Settings" onPress={() => {}} />
          <ProfileOption icon="notifications-outline" label="Notifications" onPress={() => {}} />
          <ProfileOption icon="wallet-outline" label="Payment & Budget" onPress={() => {}} />
          <ProfileOption icon="shield-checkmark-outline" label="Privacy & Security" onPress={() => {}} />
          <ProfileOption icon="help-circle-outline" label="Help & Support" onPress={() => {}} />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={Colors.light.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    padding: sizes.spacing.md,
    paddingBottom: 120, // Space for the tab bar
  },
  title: {
    fontSize: sizes.font.xxl,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: sizes.spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: sizes.spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: sizes.spacing.md,
  },
  userName: {
    fontSize: sizes.font.xl,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  userEmail: {
    fontSize: sizes.font.md,
    color: Colors.light.textSecondary,
  },
  optionsContainer: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: sizes.borderRadius.lg,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sizes.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  optionLabel: {
    flex: 1,
    marginLeft: sizes.spacing.md,
    fontSize: sizes.font.md,
    color: Colors.light.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: sizes.borderRadius.lg,
    padding: sizes.spacing.lg,
    marginTop: sizes.spacing.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  logoutText: {
    color: Colors.light.danger,
    marginLeft: sizes.spacing.sm,
    fontSize: sizes.font.md,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;