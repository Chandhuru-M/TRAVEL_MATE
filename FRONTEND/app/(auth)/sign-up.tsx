import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, sizes } from '@/constants';
import { useAuth } from '@/hooks/useAuth';

// Reusable Input Field Component
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
const SignUpScreen = () => {
  const { register, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      Alert.alert('Incomplete Fields', 'Please fill in all fields.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    // Password validation
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await register(email, password, name);
      if (error) {
        Alert.alert('Sign Up Failed', error || 'An error occurred during sign up.');
      } else {
        Alert.alert(
          'Account Created Successfully!', 
          'Your account has been created. You can now sign in.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/sign-in');
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Sign Up Failed', 'An unexpected error occurred. Please try again.');
      console.error('Sign Up Exception:', error);
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your next adventure with us</Text>

            <AuthInput
              icon="person-outline"
              placeholder="Your Name"
              value={name}
              onChangeText={setName}
            />
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
              onPress={handleSignUp}
              disabled={loading || authLoading}
            >
              {(loading || authLoading) ? (
                <ActivityIndicator color={Colors.light.cardBackground} />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/sign-in" asChild>
                <TouchableOpacity>
                  <Text style={styles.linkText}>Sign In</Text>
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

export default SignUpScreen;