// app/(tabs)/trip-planner.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import CustomHeader from '@/components/CustomHeader';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { useTripStore } from '@/services/tripService';
import { TripPlan } from '@/lib/types';
import { router } from 'expo-router';

const TripPlanCard = ({ plan, isActive }: { plan: TripPlan; isActive: boolean }) => {
  const { theme } = useTheme();
  const { setActiveTripPlan, deleteTripPlan } = useTripStore.getState();

  const handleSetActive = () => {
    // --- THIS IS THE TOGGLE LOGIC ---
    if (isActive) {
      // If the trip is already active, deactivate it by passing null
      setActiveTripPlan(null);
      Alert.alert("Trip Deactivated", `"${plan.name}" is no longer your active trip.`);
    } else {
      // If the trip is not active, prompt to activate it
      Alert.alert(
        "Set Active Trip",
        `Make "${plan.name}" your active trip? Recommendations will now be tailored for this plan.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Set Active", onPress: () => setActiveTripPlan(plan.id) }
        ]
      );
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Trip",
      `Are you sure you want to delete "${plan.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteTripPlan(plan.id) }
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card[theme], borderColor: isActive ? colors.primary[theme] : colors.card[theme] }]}
      onPress={() => router.push(`/trip/${plan.id}` as any)}
      onLongPress={handleDelete}
    >
      <Text style={[styles.cardTitle, { color: colors.text[theme] }]}>{plan.name}</Text>
      <Text style={[styles.cardSubtitle, { color: colors.textMuted[theme] }]}>{plan.destination}</Text>
      <TouchableOpacity 
        style={[styles.setActiveButton, { backgroundColor: isActive ? colors.primary[theme] : '#334155' }]} 
        onPress={handleSetActive}
      >
        <Text style={styles.setActiveButtonText}>{isActive ? 'Active' : 'Set Active'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default function TripPlannerScreen() {
  const { theme } = useTheme();
  const { tripPlans, activeTripPlanId, isLoaded, fetchTripPlans } = useTripStore();

  useEffect(() => {
    fetchTripPlans();
  }, [fetchTripPlans]);

  if (!isLoaded) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background[theme], justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary[theme]}/>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background[theme] }}>
      <CustomHeader />
      
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.text[theme] }]}>My Trips</Text>
      </View>

      {tripPlans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="suitcase" size={80} color={colors.textMuted[theme]} />
          <Text style={[styles.emptyTitle, { color: colors.text[theme] }]}>No Trips Planned</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted[theme] }]}>Let's create your first adventure!</Text>
          <TouchableOpacity style={styles.createButton} onPress={() => router.push('/create-trip' as any)}>
            <Text style={styles.createButtonText}>Create New Trip</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tripPlans}
          renderItem={({ item }) => <TripPlanCard plan={item} isActive={item.id === activeTripPlanId} />}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <TouchableOpacity style={styles.createButton} onPress={() => router.push('/create-trip' as any)}>
              <Text style={styles.createButtonText}>Create New Trip</Text>
            </TouchableOpacity>
          }
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  emptySubtitle: { fontSize: 16, marginTop: 8, textAlign: 'center' },
  createButton: { 
    backgroundColor: '#2563eb', 
    paddingVertical: 16,
    paddingHorizontal: 30, 
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 16, 
    marginBottom: 24,
    alignItems: 'center' 
  },
  createButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  list: { 
    paddingHorizontal: 20,
  },
  card: { 
    padding: 20, 
    borderRadius: 12, 
    marginBottom: 16, 
    borderWidth: 2 
  },
  cardTitle: { 
    fontSize: 22,
    fontWeight: 'bold' 
  },
  cardSubtitle: { 
    fontSize: 16, 
    marginTop: 4,
    marginBottom: 16,
  },
  setActiveButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  setActiveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});