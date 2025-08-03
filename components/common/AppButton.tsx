import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors, sizes } from '../../constants';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

const AppButton: React.FC<AppButtonProps> = ({ title, onPress, isLoading = false, style, textStyle, disabled = false }) => {
  const isDisabled = isLoading || disabled;

  return (
    <TouchableOpacity onPress={onPress} disabled={isDisabled} style={[styles.buttonContainer, style, isDisabled && styles.disabled]}>
      <LinearGradient
        Colors={[Colors.primary, '#8A82FF']} // A slightly lighter shade for the gradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={[styles.buttonText, textStyle]}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    width: '100%',
    height: 50,
    borderRadius: sizes.borderRadius.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    marginVertical: sizes.spacing.md,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: sizes.borderRadius.lg,
  },
  buttonText: {
    color: Colors.white,
    fontSize: sizes.font.md,
    fontWeight: 'bold',
  },
  disabled: {
    opacity: 0.6,
  },
});

export default AppButton;