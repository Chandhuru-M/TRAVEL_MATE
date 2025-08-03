import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, sizes } from '../../constants';

interface WalletConnectCTAProps {
  onPress: () => void;
}

const WalletConnectCTA: React.FC<WalletConnectCTAProps> = ({ onPress }) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        Colors={['#434343', '#000000']} // A sleek dark gradient
        style={styles.gradient}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="wallet" size={32} color={Colors.white} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Connect Your Wallet</Text>
          <Text style={styles.subtitle}>Track expenses dynamically for a seamless trip.</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={onPress}>
          <Text style={styles.buttonText}>Connect</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: sizes.borderRadius.lg,
    overflow: 'hidden', // Important for LinearGradient to respect border radius
    marginVertical: sizes.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sizes.spacing.lg,
  },
  iconContainer: {
    padding: sizes.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: sizes.borderRadius.full,
    marginRight: sizes.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: sizes.font.lg,
    fontWeight: 'bold',
    color: Colors.white,
  },
  subtitle: {
    fontSize: sizes.font.sm,
    color: Colors.lightGray,
    marginTop: sizes.spacing.xs,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: sizes.spacing.sm,
    paddingHorizontal: sizes.spacing.lg,
    borderRadius: sizes.borderRadius.full,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
});

export default WalletConnectCTA;