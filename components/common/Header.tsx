import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, sizes } from '../../constants';
import { useAuth } from '../../context/AuthContext'; // To get user data

interface HeaderProps {
  title: string;
  showAvatar?: boolean;
  showNotifications?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, showAvatar = true, showNotifications = true }) => {
  const { user } = useAuth(); // Assuming user object has name/email

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {user?.name && <Text style={styles.subtitle}>Hello, {user.name}!</Text>}
        </View>

        <View style={styles.iconsContainer}>
          {showNotifications && (
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          )}
          {showAvatar && user && (
            <TouchableOpacity style={styles.iconButton}>
              <Image
                source={{ uri: `https://i.pravatar.cc/150?u=${user.email}` }} // Dummy avatar
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
    backgroundColor: '#F7F8FA', // Match screen background
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
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: sizes.font.md,
    color: Colors.textSecondary,
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