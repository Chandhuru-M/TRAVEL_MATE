import React, { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { Colors, sizes } from '../../constants';

interface AppInputProps extends TextInputProps {
  label?: string;
  icon?: ReactNode;
  rightIcon?: ReactNode;
  error?: string;
  containerStyle?: ViewStyle;
}

const AppInput: React.FC<AppInputProps> = ({ label, icon, rightIcon, error, containerStyle, ...props }) => {
  return (
    <View style={[styles.outerContainer, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error ? styles.errorBorder : null]}>
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textSecondary}
          {...props}
        />
        {rightIcon && <View style={styles.iconWrapper}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    marginBottom: sizes.spacing.md,
  },
  label: {
    fontSize: sizes.font.sm,
    color: Colors.textPrimary,
    marginBottom: sizes.spacing.sm,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
    borderRadius: sizes.borderRadius.md,
    height: 50,
    paddingHorizontal: sizes.spacing.md,
    borderWidth: 1,
    borderColor: 'transparent', // Default no border
  },
  errorBorder: {
    borderColor: Colors.danger,
  },
  iconWrapper: {
    marginRight: sizes.spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: sizes.font.md,
    color: Colors.textPrimary,
  },
  errorText: {
    color: Colors.danger,
    fontSize: sizes.font.sm,
    marginTop: sizes.spacing.xs,
  },
});

export default AppInput;