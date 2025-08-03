import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors, sizes } from '../../constants';

interface PlaceFilterProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const PlaceFilter: React.FC<PlaceFilterProps> = ({ label, isActive, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.button, isActive && styles.activeButton]}
      onPress={onPress}
    >
      <Text style={[styles.text, isActive && styles.activeText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: sizes.spacing.sm,
    paddingHorizontal: sizes.spacing.lg,
    marginRight: sizes.spacing.sm,
    backgroundColor: '#F7F8FA',
    borderRadius: sizes.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  text: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  activeText: {
    color: Colors.white,
  },
});

export default PlaceFilter;