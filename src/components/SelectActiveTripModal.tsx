// src/components/SelectActiveTripModal.tsx
import React from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { TripPlan } from '@/lib/types';
import { FontAwesome } from '@expo/vector-icons';

interface SelectActiveTripModalProps {
  isVisible: boolean;
  trips: TripPlan[];
  onClose: () => void;
  onSelect: (tripId: string | null) => void;
}

export default function SelectActiveTripModal({ isVisible, trips, onClose, onSelect }: SelectActiveTripModalProps) {
  const { theme } = useTheme();

  const dynamicStyles = {
    modalContent: { backgroundColor: colors.card[theme] },
    title: { color: colors.text[theme] },
    tripItem: { borderBottomColor: colors.border[theme] },
    tripName: { color: colors.text[theme] },
    clearText: { color: colors.textMuted[theme] },
  };

  const renderTripItem = ({ item }: { item: TripPlan }) => (
    <TouchableOpacity style={[styles.tripItem, dynamicStyles.tripItem]} onPress={() => onSelect(item.id)}>
      <FontAwesome name="suitcase" size={20} color={colors.textMuted[theme]} />
      <Text style={[styles.tripName, dynamicStyles.tripName]}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.modalContent, dynamicStyles.modalContent]}>
            <View style={styles.header}>
              <Text style={[styles.title, dynamicStyles.title]}>Select Active Trip</Text>
              <TouchableOpacity onPress={onClose}>
                <FontAwesome name="close" size={24} color={colors.textMuted[theme]} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={trips}
              keyExtractor={(item) => item.id}
              renderItem={renderTripItem}
              ListEmptyComponent={
                <Text style={{ color: colors.textMuted[theme], textAlign: 'center', padding: 20 }}>
                  You have no trips planned.
                </Text>
              }
              // Add a footer to clear the active trip
              ListFooterComponent={
                <TouchableOpacity style={[styles.tripItem, dynamicStyles.tripItem]} onPress={() => onSelect(null)}>
                  <FontAwesome name="times-circle" size={20} color={colors.textMuted[theme]} />
                  <Text style={[styles.tripName, dynamicStyles.clearText]}>Clear Active Trip</Text>
                </TouchableOpacity>
              }
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end', // Position modal at the bottom
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  safeArea: {
    width: '100%',
  },
  modalContent: {
    maxHeight: '60%', // Limit height to 60% of the screen
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155', // Use a static color or from theme
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  tripName: {
    fontSize: 16,
    marginLeft: 16,
  },
  clearText: {
    fontStyle: 'italic',
  },
});