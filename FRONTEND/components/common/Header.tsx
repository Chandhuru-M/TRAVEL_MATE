import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, sizes } from '@/constants';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  title: string;
  showAvatar?: boolean;
  showNotifications?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, showAvatar = true, showNotifications = true }) => {
  const { user } = useAuth();

  // Get user name from user metadata or email
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {user && <Text style={styles.subtitle}>Hello, {userName}!</Text>}
        </View>

        <View style={styles.iconsContainer}>
          {showNotifications && (
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          )}
          {showAvatar && user && (
            <TouchableOpacity style={styles.iconButton}>
              <Image
                source={{ uri: `https://i.pravatar.cc/150?u=${user.email}` }}
                style={styles.avatar}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.light.background,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: sizes.font.xxl,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: sizes.font.md,
    color: Colors.light.textSecondary,
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: sizes.spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

export default Header;