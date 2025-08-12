import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, sizes } from '@/constants';
import { useAuth } from '@/hooks/useAuth';

// Reusable Input Field Component specific to Auth screens
const AuthInput = ({ icon, placeholder, value, onChangeText, secureTextEntry, rightIcon }: any) => (
  <View style={styles.inputContainer}>
    <Ionicons name={icon} size={22} color={Colors.light.textSecondary} style={styles.inputIcon} />
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={Colors.light.textSecondary}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      autoCapitalize="none"
      keyboardType={placeholder.toLowerCase().includes('email') ? 'email-address' : 'default'}
    />
    {rightIcon}
  </View>
);

// Main Component
const SignInScreen = () => {
  const { login, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Incomplete Fields', 'Please enter both email and password.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await login(email, password);
      if (error) {
        Alert.alert('Sign In Failed', error.message || 'An error occurred during sign in.');
      }
      // On success, the AuthContext will handle navigation automatically
    } catch (error) {
      Alert.alert('Sign In Failed', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <View style={styles.container}>
            <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue your journey</Text>

            <AuthInput
              icon="mail-outline"
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
            />
            <AuthInput
              icon="lock-closed-outline"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={Colors.light.textSecondary} />
                </TouchableOpacity>
              }
            />

            <TouchableOpacity
              style={[styles.button, (loading || authLoading) && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading || authLoading}
            >
              {(loading || authLoading) ? (
                <ActivityIndicator color={Colors.light.cardBackground} />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Link href="/sign-up" asChild>
                <TouchableOpacity>
                  <Text style={styles.linkText}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.cardBackground,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: sizes.spacing.xl,
  },
  logo: {
    width: 180,
    height: 60,
    resizeMode: 'contain',
    marginBottom: sizes.spacing.md,
  },
  title: {
    fontSize: sizes.font.xxl,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: sizes.spacing.sm,
  },
  subtitle: {
    fontSize: sizes.font.md,
    color: Colors.light.textSecondary,
    marginBottom: sizes.spacing.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    backgroundColor: Colors.light.background,
    borderRadius: sizes.borderRadius.md,
    paddingHorizontal: sizes.spacing.md,
    marginBottom: sizes.spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  inputIcon: {
    marginRight: sizes.spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    color: Colors.light.text,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: Colors.light.primary,
    borderRadius: sizes.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: sizes.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.light.cardBackground,
    fontSize: sizes.font.md,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    marginTop: sizes.spacing.xl,
  },
  footerText: {
    color: Colors.light.textSecondary,
    fontSize: sizes.font.md,
  },
  linkText: {
    color: Colors.light.primary,
    fontSize: sizes.font.md,
    fontWeight: 'bold',
  },
});

export default SignInScreen;