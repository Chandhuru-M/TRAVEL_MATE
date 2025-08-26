// app/trip/[id].tsx
// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, useWindowDimensions, ScrollView, SectionList, TouchableOpacity, FlatList } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { useTripStore } from '@/services/tripService';
import { useFinanceStore } from '@/services/financeService';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import ItineraryItemCard from '@/components/ItineraryItemCard';
import PlaceCard from '@/components/PlaceCard';
import TransactionItem from '@/components/TransactionItem';
import { DndContext, Draggable, Droppable } from '@dnd-kit/core'; // Import DND components

// --- THE FINAL, DRAGGABLE ITINERARY TAB ---
const ItineraryRoute = ({ trip }) => {
  const { theme } = useTheme();
  // We would use DndContext here to wrap the entire timeline
  // Each ItineraryItemCard would be a <Draggable>
  // The timeline itself would be a <Droppable> area

  // This is a simplified representation of the UI. A full implementation
  // requires significant state management for drag events (onDragStart, onDragEnd).

  const handleDragEnd = (event) => {
    // Handle drag end logic here
    console.log('Drag ended:', event);
  };

  const timeToPosition = (time) => {
    // Convert time string to pixel position
    const [hours, minutes] = time.split(':').map(Number);
    return (hours * 60 + minutes) * 1; // 1 pixel per minute
  };

  const durationToHeight = (startTime, endTime) => {
    // Calculate height based on duration
    const start = timeToPosition(startTime);
    const end = timeToPosition(endTime);
    return end - start;
  };

  // This is the onPress handler for the "Add" buttons
  const handleOpenAddModal = () => {
    router.push({
      pathname: '/add-to-itinerary',
      params: { tripId: trip.id }, // Pass the tripId as a parameter
    });
  };

  const sections = useMemo(() => {
    if (!trip?.itinerary) return [];
    const grouped = trip.itinerary.reduce((acc, item) => {
      const dayTitle = `Day ${item.day}`;
      if (!acc[dayTitle]) { acc[dayTitle] = []; }
      acc[dayTitle].push(item);
      return acc;
    }, {});
    return Object.keys(grouped).map(dayTitle => ({ title: dayTitle, data: grouped[dayTitle] }));
  }, [trip?.itinerary]);

  if (sections.length === 0) {
    return (
      <View style={styles.emptySceneContainer}>
        <Text style={[styles.emptySceneText, { color: colors.textMuted[theme] }]}>Your itinerary is empty.</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleOpenAddModal}>
          <Text style={styles.addButtonText}>Add First Item</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <ScrollView>
        {/* Render timeline hours (00:00, 01:00, etc.) */}
        <View style={styles.timelineContainer}>
          {trip.itinerary.map(item => (
            <Draggable key={item.id} id={item.id}>
              {/* The ItineraryItemCard would be rendered here, positioned absolutely */}
              <View style={[styles.eventCard, { top: timeToPosition(item.startTime), height: durationToHeight(item.startTime, item.endTime) }]}>
                <Text>{item.title}</Text>
              </View>
            </Draggable>
          ))}
          <Droppable id="timeline">
            <View style={styles.dropZone} />
          </Droppable>
        </View>
      </ScrollView>
      {/* Draggable panel for Saved Places at the bottom */}
      <View style={styles.savedPlacesPanel}>
        {trip.saved_places?.map(place => (
          <Draggable key={place.fsq_id} id={place.fsq_id} data={{ place }}>
            <View style={styles.savedPlaceChip}><Text>{place.name}</Text></View>
          </Draggable>
        ))}
      </View>
    </DndContext>
  );
};

// --- TAB 2: SAVED PLACES ---
const SavedPlacesRoute = ({ trip }) => {
  const { theme } = useTheme();
  if (!trip.saved_places || trip.saved_places.length === 0) {
    return (
      <View style={styles.emptySceneContainer}>
        <Text style={[styles.emptySceneText, { color: colors.textMuted[theme] }]}>
          No saved places yet. Go to the Home screen to find and save places!
        </Text>
      </View>
    );
  }
  return (
    <FlatList
      data={trip.saved_places}
      renderItem={({ item }) => <PlaceCard place={item} />}
      keyExtractor={(item) => item.fsq_id}
      contentContainerStyle={styles.list}
    />
  );
};

// --- TAB 3: BUDGET ---
const BudgetRoute = ({ trip }) => {
  const { theme } = useTheme();
  const { transactions } = useFinanceStore();
  const tripTransactions = useMemo(() => {
    return transactions.filter(t => t.trip_id === trip.id);
  }, [transactions, trip.id]);

  const spentAmount = tripTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalBudget = trip.budget.totalAmount;
  const remainingBudget = totalBudget - spentAmount;
  const progress = totalBudget > 0 ? (spentAmount / totalBudget) * 100 : 0;

  return (
    <ScrollView style={styles.sceneContainer}>
      <View style={[styles.budgetSummaryCard, { backgroundColor: colors.card[theme] }]}>
        <Text style={[styles.budgetTitle, { color: colors.text[theme] }]}>Budget Overview</Text>
        <Text style={[styles.remainingText, { color: colors.text[theme] }]}>
          ₹{remainingBudget.toLocaleString()} Remaining
        </Text>
        <View style={[styles.progressBarBackground, { backgroundColor: colors.border[theme] }]}>
          <View style={[styles.progressBarFill, { width: `${progress > 100 ? 100 : progress}%`, backgroundColor: progress > 100 ? '#ef4444' : colors.primary[theme] }]} />
        </View>
        <Text style={[styles.budgetText, { color: colors.textMuted[theme] }]}>
          Spent ₹{spentAmount.toLocaleString()} of ₹{totalBudget.toLocaleString()}
        </Text>
      </View>
      <Text style={[styles.listHeader, { color: colors.text[theme] }]}>Trip Expenses</Text>
      {tripTransactions.length > 0 ? (
        <View style={{paddingHorizontal: 16}}>
          {tripTransactions.map(item => <TransactionItem key={item.id} item={item} />)}
        </View>
      ) : (
        <Text style={[styles.emptySceneText, { color: colors.textMuted[theme], marginTop: 20 }]}>
          No expenses have been linked to this trip yet.
        </Text>
      )}
    </ScrollView>
  );
};

export default function TripDetailScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams();
  const { tripPlans } = useTripStore();
  const layout = useWindowDimensions();

  const trip = tripPlans.find(p => p.id === id);

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'itinerary', title: 'Itinerary' },
    { key: 'saved', title: 'Saved Places' },
    { key: 'budget', title: 'Budget' },
  ]);

  const renderScene = SceneMap({
    itinerary: () => <ItineraryRoute trip={trip} />,
    saved: () => <SavedPlacesRoute trip={trip} />,
    budget: () => <BudgetRoute trip={trip} />,
  });

  if (!trip) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background[theme], justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary[theme]} />
      </SafeAreaView>
    );
  }

  return (
    // The SafeAreaView ensures content (like the bottom of a list) doesn't hit the home indicator on iOS
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background[theme] }}>
      {/* This is the spacious header block, rendered below the native header */}
      <View style={styles.tripHeader}>
        <Text style={[styles.tripTitle, { color: colors.text[theme] }]}>{trip.name}</Text>
        <Text style={[styles.tripSubtitle, { color: colors.textMuted[theme] }]}>{trip.destination}</Text>
      </View>

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={props => (
          // @ts-ignore
          <TabBar
            {...props}
            style={{ backgroundColor: colors.background[theme], shadowOpacity: 0, elevation: 0 }}
            indicatorStyle={{ backgroundColor: colors.primary[theme], height: 3 }}
            labelStyle={styles.labelStyle}
            activeColor={colors.primary[theme]}
            inactiveColor={colors.textMuted[theme]}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tripHeader: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: 'transparent', // Ensures it uses the SafeAreaView's background
  },
  tripTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  tripSubtitle: {
    fontSize: 18,
    marginTop: 4,
  },
  labelStyle: {
    fontWeight: 'bold',
    fontSize: 16,
    textTransform: 'none',
  },
  emptySceneContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptySceneText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sceneContainer: {
    flex: 1,
  },
  budgetSummaryCard: {
    padding: 20,
    borderRadius: 12,
    margin: 16,
  },
  budgetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  remainingText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  budgetText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'right',
  },
  listHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  list: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  timelineContainer: {
    position: 'relative',
    height: 24 * 60, // 24 hours * 60 pixels per hour
  },
  eventCard: {
    position: 'absolute',
    left: 60,
    right: 10,
    backgroundColor: 'lightblue',
    borderRadius: 8,
    padding: 8,
  },
  dropZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  savedPlacesPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'lightgrey',
    flexDirection: 'row',
    padding: 8,
  },
  savedPlaceChip: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 16,
    marginHorizontal: 4,
  },
});