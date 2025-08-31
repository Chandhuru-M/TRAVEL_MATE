// app/trip/[id].tsx
// @ts-nocheck

import 'react-native-get-random-values';
import React, { useState, useMemo } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { useTripStore } from '@/services/tripService';
import { getLocalTripPhotos, addLocalTripPhoto, removeLocalTripPhoto } from '@/lib/localPhotos';
// ...existing code...
// --- TAB 4: PHOTOS ---
const TripPhotosRoute = ({ trip }) => {
  const { theme } = useTheme();
  const [photos, setPhotos] = useState(trip.photos || []);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Load locally stored photos for this trip id on mount
  React.useEffect(() => {
    (async () => {
      const local = await getLocalTripPhotos(trip.id);
      if (local?.length) {
        setPhotos(prev => {
          const merged = [...prev];
          for (const uri of local) if (!merged.includes(uri)) merged.push(uri);
          return merged;
        });
      }
    })();
  }, [trip.id]);

  // Save photo only to local storage
  const saveLocalPhoto = async (uri: string) => {
    try {
      setSaving(true);
      await addLocalTripPhoto(trip.id, uri);
      setPhotos(prev => [...prev, uri]);
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    try {
      console.log('pickImage pressed');
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        alert('Permission to access photos is required.');
        if (perm.canAskAgain === false) {
          alert('Please enable Photos permission in Settings for TRAVEL_MATE.');
        }
        return;
      }
      const mediaTypeEnum = (ImagePicker?.MediaType && ImagePicker.MediaType.IMAGE) || ImagePicker.MediaTypeOptions.Images;
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaTypeEnum,
        allowsMultipleSelection: true,
        quality: 1,
      });
      if (!result.canceled) {
        const newPhotos = result.assets ? result.assets.map(a => a.uri) : [result.uri];
        for (const uri of newPhotos) {
          await saveLocalPhoto(uri);
        }
      }
    } catch (e) {
      console.error('pickImage error:', e);
      alert('Could not open photo library.');
    }
  };

  const takePhoto = async () => {
    try {
      console.log('takePhoto pressed');
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== 'granted') {
        alert('Camera permission is required.');
        if (perm.canAskAgain === false) {
          alert('Please enable Camera permission in Settings for TRAVEL_MATE.');
        }
        return;
      }
      const mediaTypeEnum = (ImagePicker?.MediaType && ImagePicker.MediaType.IMAGE) || ImagePicker.MediaTypeOptions.Images;
      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: mediaTypeEnum,
        quality: 1,
      });
      if (!result.canceled) {
        const newPhotos = result.assets ? result.assets.map(a => a.uri) : [result.uri];
        for (const uri of newPhotos) {
      await saveLocalPhoto(uri);
        }
      }
    } catch (e) {
      console.error('takePhoto error:', e);
      alert('Could not open camera.');
    }
  };

  const deletePhoto = async (uri: string) => {
    // Ask user to confirm
    try {
      setDeleting(uri);
    // Local photo only
    await removeLocalTripPhoto(trip.id, uri);
      // Update local UI state
      setPhotos(prev => prev.filter(p => p !== uri));
    } catch (e) {
      Alert.alert('Delete failed', 'Could not delete this photo.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        <TouchableOpacity
          style={[
            styles.addButton,
            {
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 18,
              minHeight: 40,
              borderRadius: 10,
            },
          ]}
          onPress={pickImage}
          disabled={saving}
        >
          <Text style={[styles.addButtonText, { fontSize: 16 }]}>{saving ? 'Saving...' : '+ Add Photo'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.addButton,
            {
              flex: 1,
              backgroundColor: '#22c55e',
              paddingVertical: 10,
              paddingHorizontal: 18,
              minHeight: 40,
              borderRadius: 10,
            },
          ]}
          onPress={takePhoto}
          disabled={saving}
        >
          <Text style={[styles.addButtonText, { fontSize: 16 }]}>📷 Take Photo</Text>
        </TouchableOpacity>
      </View>
      {photos.length === 0 ? (
        <Text style={[styles.emptySceneText, { color: colors.textMuted[theme] }]}>No photos yet. Add your first trip photo!</Text>
      ) : (
        <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {photos.map((uri, idx) => (
            <View key={idx} style={{ width: 120, height: 120, margin: 6 }}>
              <Image source={{ uri }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
              <TouchableOpacity
                onPress={() => deletePhoto(uri)}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  paddingVertical: 4,
                  paddingHorizontal: 6,
                  borderRadius: 8,
                }}
                disabled={deleting === uri}
              >
                <Text style={{ color: 'white', fontSize: 12 }}>{deleting === uri ? '...' : 'Delete'}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, useWindowDimensions, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
// ...existing code...
import { useFinanceStore } from '@/services/financeService';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { differenceInDays } from 'date-fns';
import ItineraryItemCard from '@/components/ItineraryItemCard';
import PlaceCard from '@/components/PlaceCard';
import TransactionItem from '@/components/TransactionItem';

// --- THE FINAL, VISUAL ITINERARY SCHEDULER ---
const ItineraryRoute = ({ trip }) => {
  const { theme } = useTheme();
  const { deleteItineraryItem } = useTripStore.getState();
  const [selectedDay, setSelectedDay] = useState(1); // State to track the selected day

  const totalDays = differenceInDays(new Date(trip.dates.end), new Date(trip.dates.start)) + 1;
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  // Filter the itinerary for the currently selected day
  const dayItinerary = useMemo(() => {
    return (trip.itinerary || [])
      .filter(item => item.day === selectedDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [trip.itinerary, selectedDay]);

  const handleAddItem = (day, startTime) => {
    // Navigate to the form to create a NEW item, pre-filling the day and start time
    router.push({ pathname: '/edit-itinerary-item', params: { tripId: trip.id, day, startTime } });
  };

  const handleDelete = (item) => {
    Alert.alert("Delete Event", `Are you sure you want to delete "${item.place?.name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteItineraryItem(trip.id, item.id) }
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Day Selector Buttons */}
      <View style={styles.daySelectorContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {days.map(day => (
            <View key={day} style={{ marginRight: 8 }}>
              <TouchableOpacity
                style={[
                  styles.dayButton,
                  selectedDay === day && { backgroundColor: colors.primary[theme] }
                ]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[styles.dayButtonText, selectedDay === day && { color: 'white' }]}>Day {day}</Text>
              </TouchableOpacity>
              {/* Small red minus on the top-right of the last day */}
              {day === days[days.length - 1] && (
                <TouchableOpacity
                  onPress={async () => {
                    Alert.alert('Remove last day', `Are you sure you want to remove Day ${day}? This will delete its events.`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: async () => {
                        try {
                          const res = await useTripStore.getState().removeLastDay(trip.id);
                          if (res.success) {
                            const newSelected = Math.max(1, days.length - 1);
                            setSelectedDay(newSelected);
                          } else {
                            Alert.alert('Could not remove day', res.error || 'Unknown error');
                          }
                        } catch (e) {
                          Alert.alert('Error', 'Could not remove day.');
                        }
                      } }
                    ]);
                  }}
                  style={styles.removeBadge}
                >
                  <Text style={styles.removeBadgeText}>-</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* + Day button to extend the trip by one day */}
          <TouchableOpacity
            key="add-day"
            style={[styles.addDayButton, { borderColor: colors.primary[theme], marginLeft: 8 }]}
            onPress={async () => {
              try {
                const res = await useTripStore.getState().extendTripDays(trip.id, 1);
                if (res.success) {
                  const newTotal = days.length + 1;
                  setSelectedDay(newTotal);
                } else {
                  Alert.alert('Could not add day', res.error || 'Unknown error');
                }
              } catch (e) {
                Alert.alert('Error', 'Could not extend trip days.');
              }
            }}
          >
            <Text style={[styles.addDayButtonText, { color: colors.primary[theme] }]}>+ Day {days.length + 1}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Timeline View */}
      <ScrollView contentContainerStyle={styles.timelineContainer}>
        {dayItinerary.length > 0 ? (
          dayItinerary.map(item => (
            <ItineraryItemCard
              key={item.id}
              item={item}
              onPress={() => router.push({ pathname: '/edit-itinerary-item', params: { tripId: trip.id, item: JSON.stringify(item) } })}
              onDelete={() => handleDelete(item)} // Pass the delete handler
            />
          ))
        ) : (
          <View style={styles.emptySceneContainer}>
            <Text style={[styles.emptySceneText, { color: colors.textMuted[theme] }]}>No events scheduled for this day.</Text>
          </View>
        )}
        <TouchableOpacity style={styles.addButton} onPress={() => handleAddItem(selectedDay, '09:00')}>
          <Text style={styles.addButtonText}>+ Add Event to Day {selectedDay}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  const { transactions, fetchData } = useFinanceStore();
  const tripTransactions = useMemo(() => {
    return transactions.filter(t => t.trip_id === trip.id);
  }, [transactions, trip.id]);

  const spentAmount = tripTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalBudget = trip.budget.totalAmount;
  const remainingBudget = totalBudget - spentAmount;
  const progress = totalBudget > 0 ? (spentAmount / totalBudget) * 100 : 0;

  return (
    <ScrollView style={styles.sceneContainer} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TouchableOpacity style={[styles.smallButton, { backgroundColor: colors.primary[theme] }]} onPress={() => router.push({ pathname: '/add-transaction', params: { tripId: trip.id } })}>
          <Text style={{ color: 'white', fontWeight: '700' }}>+ Add Transaction</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.smallButton, { backgroundColor: colors.border[theme] }]} onPress={() => fetchData()}>
          <Text style={{ color: colors.text[theme], fontWeight: '700' }}>Refresh Wallet</Text>
        </TouchableOpacity>
      </View>

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

      <Text style={[styles.listHeader, { color: colors.text[theme], marginTop: 20 }]}>Wallet Recent Transactions</Text>
      {transactions.length > 0 ? (
        <View style={{ paddingHorizontal: 16 }}>
          {transactions.slice(0, 10).map(t => <TransactionItem key={t.id} item={t} />)}
        </View>
      ) : (
        <Text style={[styles.emptySceneText, { color: colors.textMuted[theme], marginTop: 8 }]}>No transactions in your wallet yet.</Text>
      )}
    </ScrollView>
  );
};

export default function TripDetailScreen() {
  const { theme, timeFormat, toggleTimeFormat } = useTheme(); // Get time format state
  const { id } = useLocalSearchParams();
  const { tripPlans } = useTripStore();
  const layout = useWindowDimensions();

  const trip = tripPlans.find(p => p.id === id);

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'itinerary', title: 'Itinerary' },
    { key: 'saved', title: 'Saved Places' },
    { key: 'budget', title: 'Budget' },
    { key: 'photos', title: 'Photos' },
  ]);

  const renderScene = SceneMap({
    itinerary: () => <ItineraryRoute trip={trip} />,
    saved: () => <SavedPlacesRoute trip={trip} />,
    budget: () => <BudgetRoute trip={trip} />,
    photos: () => <TripPhotosRoute trip={trip} />,
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
        <View>
          <Text style={[styles.tripTitle, { color: colors.text[theme] }]}>{trip.name}</Text>
          <Text style={[styles.tripSubtitle, { color: colors.textMuted[theme] }]}>{trip.destination}</Text>
        </View>
        {/* --- TIME FORMAT TOGGLE --- */}
        <TouchableOpacity onPress={toggleTimeFormat} style={styles.timeFormatButton}>
          <Text style={{ color: colors.primary[theme], fontWeight: 'bold' }}>
            {timeFormat === '12h' ? '24H' : '12H'}
          </Text>
        </TouchableOpacity>
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
    flexDirection: 'row', // Make header a row
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeFormatButton: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
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
  daySelectorContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#334155',
  },
  dayButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  timelineContainer: {
    padding: 16,
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  addDayButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
  borderStyle: 'dotted',
  },
  addDayButtonText: {
    fontWeight: '600',
  },
  removeBadge: {
    position: 'absolute',
    right: -6,
    top: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 10,
  },
  removeBadgeText: {
    color: 'white',
    fontSize: 12,
    lineHeight: 12,
    fontWeight: '700',
  },
});