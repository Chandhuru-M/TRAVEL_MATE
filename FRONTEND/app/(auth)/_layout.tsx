import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

const AuthLayout = () => {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="sign-in" // Corresponds to sign-in.tsx
        />
        <Stack.Screen
          name="sign-up" // Corresponds to sign-up.tsx
        />
      </Stack>
      {/* Set status bar style for a consistent look on auth screens */}
      <StatusBar backgroundColor="#FFFFFF" style="dark" />
    </>
  );
};

export default AuthLayout;