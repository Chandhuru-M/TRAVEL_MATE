import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors, sizes } from '../../constants';

interface MapControlsProps {
  onRecenter: () => void;
  onToggleNavigate?: () => void; // Optional navigation toggle
}

const MapControls: React.FC<MapControlsProps> = ({ onRecenter, onToggleNavigate }) => {
  return (
    <View style={styles.container}>
      {onToggleNavigate && (
        <TouchableOpacity style={styles.button} onPress={onToggleNavigate}>
          <Ionicons name="navigate" size={24} color={Colors.primary} />
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.button} onPress={onRecenter}>
        <Ionicons name="locate" size={24} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120, // Adjust this value to sit nicely above your tab bar
    right: sizes.spacing.md,
    flexDirection: 'column',
  },
  button: {
    backgroundColor: Colors.white,
    padding: sizes.spacing.md,
    borderRadius: sizes.borderRadius.full,
    marginBottom: sizes.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
});

export default MapControls;