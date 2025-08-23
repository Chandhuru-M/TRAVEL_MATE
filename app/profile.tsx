// app/profile.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext'; // 1. Import useTheme
import { colors } from '@/constants/Colors'; // 2. Import colors

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { theme } = useTheme(); 
  
  const dynamicStyles = {
    container: {
      backgroundColor: colors.background[theme],
    },
    header: {
      borderBottomColor: colors.border[theme],
    },
    headerTitle: {
      color: colors.text[theme],
    },
    menuItem: {
      backgroundColor: colors.card[theme],
      borderBottomColor: colors.background[theme],
    },
    menuItemText: {
      color: colors.text[theme],
    },
    icon: {
      color: colors.textMuted[theme],
    },
  };

  return (
    // 4. Apply dynamic styles to all components
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <View style={[styles.header, dynamicStyles.header]}>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Profile & Settings</Text>
      </View>
      <View style={styles.content}>
        {/* You can add other settings items here in the future */}
        <TouchableOpacity style={[styles.menuItem, dynamicStyles.menuItem]} onPress={signOut}>
            <FontAwesome name="sign-out" size={22} color="#be123c" />
            <Text style={[styles.menuItemText, styles.logoutText]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Static styles that don't change with the theme
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    marginTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: 18,
    marginLeft: 20,
    flex: 1,
  },
  logoutText: {
    color: '#be123c', // Destructive action color can stay consistent
  },
});