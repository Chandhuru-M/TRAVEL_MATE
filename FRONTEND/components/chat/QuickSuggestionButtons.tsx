import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, sizes } from '@/constants';

interface QuickSuggestionButtonsProps {
  suggestions: string[];
  onPress: (suggestion: string) => void;
}

const QuickSuggestionButtons: React.FC<QuickSuggestionButtonsProps> = ({ suggestions, onPress }) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={styles.button}
            onPress={() => onPress(suggestion)}
          >
            <Text style={styles.buttonText}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: sizes.spacing.sm,
  },
  scrollContainer: {
    paddingHorizontal: sizes.spacing.md,
  },
  button: {
    backgroundColor: Colors.light.cardBackground,
    paddingVertical: sizes.spacing.sm,
    paddingHorizontal: sizes.spacing.md,
    borderRadius: sizes.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginRight: sizes.spacing.sm,
  },
  buttonText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default QuickSuggestionButtons;