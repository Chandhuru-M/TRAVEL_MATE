// src/services/tripService.ts
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { TripPlan, Place, ItineraryItem } from '@/lib/types';
import uuid from 'react-native-uuid';
import { addMinutes, format, parse, differenceInMinutes, differenceInDays, addDays } from 'date-fns';

/**
 * Internal helper function to recalculate travel legs for a given day's events.
 * This ensures the timeline is always logical after any change.
 * @param dayItinerary An array of itinerary items for a single day.
 * @returns A new array for that day's itinerary with travel legs correctly inserted.
 */
const _recalculateAndFormatDayItinerary = (dayItinerary: ItineraryItem[]): ItineraryItem[] => {
  const newDayItinerary: ItineraryItem[] = [];
  // First, filter out any old travel legs to start fresh
  const sortedEvents = dayItinerary
    .filter(i => i.type !== 'travel')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  
  let lastItem: ItineraryItem | null = null;

  for (const event of sortedEvents) {
    if (lastItem) {
      const travelEndTime = parse(event.startTime, 'HH:mm', new Date());
      const travelStartTime = parse(lastItem.endTime, 'HH:mm', new Date());
      const duration = differenceInMinutes(travelEndTime, travelStartTime);

      // Only add a travel leg if there is a time gap between events
      if (duration > 0) {
        const travelItem: ItineraryItem = {
          id: uuid.v4() as string,
          day: event.day,
          startTime: lastItem.endTime,
          endTime: event.startTime,
          type: 'travel',
          isDefault: false, // Add the required isDefault field
          travelDetails: {
            from: lastItem.place!.name, // Assumes last item has a place
            to: event.place!.name,     // Assumes current event has a place
            mode: 'car',
            estimatedDuration: duration,
          },
        };
        newDayItinerary.push(travelItem);
      }
    }
    newDayItinerary.push(event);
    lastItem = event;
  }
  return newDayItinerary;
};

/**
 * The complete and correct interface for our trip management store.
 */
// --- THIS IS THE FIX: The complete and correct interface ---
interface TripState {
  isLoaded: boolean;
  tripPlans: TripPlan[];
  activeTripPlanId: string | null;
  fetchTripPlans: () => Promise<void>;
  createTripPlan: (details: any) => Promise<void>;
  setActiveTripPlan: (tripId: string | null) => void;
  savePlaceToTrip: (tripId: string, place: Place) => Promise<{ success: boolean; error?: string }>;

  addItineraryItem: (tripId: string, itemDetails: Omit<ItineraryItem, 'id' | 'type'>) => Promise<void>;
  updateItineraryItem: (tripId: string, updatedItem: ItineraryItem) => Promise<void>;
  deleteItineraryItem: (tripId: string, itemId: string) => Promise<void>;
  deleteTripPlan: (tripId: string) => Promise<void>;
  // Re-add the missing function definition
  moveSavedPlaceToItinerary: (tripId: string, day: number, place: Place, durationInMinutes: number) => Promise<{ success: boolean; error?: string }>;

}
// --- END OF FIX ---

export const useTripStore = create<TripState>((set, get) => ({
  isLoaded: false,
  tripPlans: [],
  activeTripPlanId: null,

  fetchTripPlans: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ isLoaded: true, tripPlans: [] });
      return;
    }
    const { data, error } = await supabase.from('trip_plans').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error("Error fetching trip plans:", error);
      set({ isLoaded: true });
    } else {
      set({ tripPlans: (data as TripPlan[]) || [], isLoaded: true });
    }
  },

  // --- THIS IS THE FINAL, CORRECT IMPLEMENTATION ---
  createTripPlan: async (details) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const startDate = new Date(details.dates.start);
    const endDate = new Date(details.dates.end);
    // Calculate the total number of days for the trip
    const totalDays = differenceInDays(endDate, startDate) + 1;

    const defaultItinerary: ItineraryItem[] = [];
    
    // Loop from Day 1 to the total number of days
    for (let i = 1; i <= totalDays; i++) {
      const createDefaultPlace = (name: string, fsq_id: string): Place => ({
        fsq_id,
        name,
        categories: [{ name: 'Default' }],
      });

      // Add the four permanent, default events for the current day (i)
      defaultItinerary.push(
        { id: uuid.v4() as string, day: i, startTime: '08:00', endTime: '09:00', type: 'default', isDefault: true, defaultType: 'breakfast', place: createDefaultPlace('Breakfast', `default_breakfast_${i}`) },
        { id: uuid.v4() as string, day: i, startTime: '13:00', endTime: '14:00', type: 'default', isDefault: true, defaultType: 'lunch', place: createDefaultPlace('Lunch', `default_lunch_${i}`) },
        { id: uuid.v4() as string, day: i, startTime: '20:00', endTime: '21:00', type: 'default', isDefault: true, defaultType: 'dinner', place: createDefaultPlace('Dinner', `default_dinner_${i}`) },
        { id: uuid.v4() as string, day: i, startTime: '23:00', endTime: '23:59', type: 'default', isDefault: true, defaultType: 'sleep', place: createDefaultPlace('Sleep', `default_sleep_${i}`) }
      );
    }

    // Recalculate the itinerary to add the travel legs between these default events
    const finalDefaultItinerary = _recalculateAndFormatDayItinerary(defaultItinerary);

    const newPlanData = {
      ...details,
      user_id: user.id,
      budget: { ...details.budget, spentAmount: 0 },
      itinerary: finalDefaultItinerary, // Assign the generated schedule
      saved_places: [],
      status: 'planning',
    };
    
    const { data: newPlan } = await supabase.from('trip_plans').insert(newPlanData).select().single();
    if (newPlan) {
      // Add the new trip to the local state for immediate UI update
      set(state => ({ tripPlans: [newPlan as TripPlan, ...state.tripPlans] }));
    }
  },

  setActiveTripPlan: (tripId) => {
    set({ activeTripPlanId: tripId });
  },

  // --- THIS IS THE FIX ---
  // Add the correct types to the function implementation
  savePlaceToTrip: async (tripId: string, place: Place) => {
    const trip = get().tripPlans.find(p => p.id === tripId);
    if (!trip) { return { success: false, error: "Trip not found." }; }
    if (trip.saved_places.some(p => p.fsq_id === place.fsq_id)) { return { success: true }; }
    const updatedSavedPlaces = [...trip.saved_places, place];
    const { error } = await supabase.from('trip_plans').update({ saved_places: updatedSavedPlaces }).eq('id', tripId);
    if (error) {
      console.error("Error saving place:", error);
      return { success: false, error: error.message };
    }
    set(state => ({
      tripPlans: state.tripPlans.map(p =>
        p.id === tripId ? { ...p, saved_places: updatedSavedPlaces } : p
      ),
    }));
    return { success: true };
  },
  // -----------------------

  addItineraryItem: async (tripId, itemDetails) => {
    const trip = get().tripPlans.find(p => p.id === tripId);
    if (!trip) return;
    // --- FIX: Ensure all required properties are included ---
    const newItem: ItineraryItem = {
      ...itemDetails,
      id: uuid.v4() as string,
      type: 'attraction',
      isDefault: false, // User-created events are never default
    };
    const dayItinerary = [...(trip.itinerary || []).filter(i => i.day === newItem.day), newItem];
    const otherDaysItinerary = (trip.itinerary || []).filter(i => i.day !== newItem.day);
    const newFullItinerary = [...otherDaysItinerary, ..._recalculateAndFormatDayItinerary(dayItinerary)];
    await supabase.from('trip_plans').update({ itinerary: newFullItinerary }).eq('id', tripId);
    set(state => ({ tripPlans: state.tripPlans.map(p => p.id === tripId ? { ...p, itinerary: newFullItinerary } : p) }));
  },

  // The updateItineraryItem function will now be the primary tool.
  // It can update a default item (change its time, link a real Place) or a user-created one.
  updateItineraryItem: async (tripId, updatedItem) => {
    const trip = get().tripPlans.find(p => p.id === tripId);
    if (!trip) return;

    // If a real place is being linked to a default event, change its type
    if (updatedItem.isDefault && updatedItem.place && !updatedItem.place.fsq_id.startsWith('default_')) {
      updatedItem.type = 'attraction';
    }

    const dayItinerary = (trip.itinerary || [])
      .filter(i => i.day === updatedItem.day)
      .map(item => item.id === updatedItem.id ? updatedItem : item);
    
    const otherDaysItinerary = (trip.itinerary || []).filter(i => i.day !== updatedItem.day);
    const newFullItinerary = [...otherDaysItinerary, ..._recalculateAndFormatDayItinerary(dayItinerary)];
    await supabase.from('trip_plans').update({ itinerary: newFullItinerary }).eq('id', tripId);
    set(state => ({ tripPlans: state.tripPlans.map(p => p.id === tripId ? { ...p, itinerary: newFullItinerary } : p) }));
  },

  // The deleteItineraryItem function will now PREVENT deletion of default items.
  deleteItineraryItem: async (tripId, itemId) => {
    const trip = get().tripPlans.find(p => p.id === tripId);
    if (!trip) return;
    const itemToDelete = trip.itinerary.find(i => i.id === itemId);
    if (!itemToDelete || itemToDelete.isDefault) {
      // CRITICAL: Do not allow deletion of default events
      console.log("Attempted to delete a default event. Action prevented.");
      return;
    }
    const dayItinerary = (trip.itinerary || []).filter(i => i.day === itemToDelete.day && i.id !== itemId);
    const otherDaysItinerary = (trip.itinerary || []).filter(i => i.day !== itemToDelete.day);
    const newFullItinerary = [...otherDaysItinerary, ..._recalculateAndFormatDayItinerary(dayItinerary)];
    await supabase.from('trip_plans').update({ itinerary: newFullItinerary }).eq('id', tripId);
    set(state => ({ tripPlans: state.tripPlans.map(p => p.id === tripId ? { ...p, itinerary: newFullItinerary } : p) }));
  },

  deleteTripPlan: async (tripId: string) => {
    const { error } = await supabase.from('trip_plans').delete().eq('id', tripId);
    if (error) {
      console.error("Error deleting trip:", error);
      return;
    }
    set(state => ({
      tripPlans: state.tripPlans.filter(p => p.id !== tripId),
      activeTripPlanId: state.activeTripPlanId === tripId ? null : state.activeTripPlanId,
    }));
  },

  // --- IMPLEMENTATION FOR THE MISSING FUNCTION ---
  moveSavedPlaceToItinerary: async (tripId, day, place, durationInMinutes) => {
    const trip = get().tripPlans.find(p => p.id === tripId);
    if (!trip) return { success: false, error: "Trip not found." };

    // 1. Create the new itinerary item from the place
    const dayItinerary = (trip.itinerary || []).filter(item => item.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
    const lastItem = dayItinerary[dayItinerary.length - 1];
    let newEventStartTime: Date;
    if (lastItem) {
      newEventStartTime = addMinutes(parse(lastItem.endTime, 'HH:mm', new Date()), 30);
    } else {
      newEventStartTime = parse('09:00', 'HH:mm', new Date());
    }
    const newEventEndTime = addMinutes(newEventStartTime, durationInMinutes);
    const newItineraryItem: ItineraryItem = {
      id: uuid.v4() as string,
      day,
      startTime: format(newEventStartTime, 'HH:mm'),
      endTime: format(newEventEndTime, 'HH:mm'),
      type: 'attraction',
      place: place,
      isDefault: false, // Items from saved places are not default
    };
    
    // 2. Add the new item and recalculate the day's schedule
    const newDayItinerary = [...dayItinerary, newItineraryItem];
    const otherDaysItinerary = (trip.itinerary || []).filter(i => i.day !== day);
    const newFullItinerary = [...otherDaysItinerary, ..._recalculateAndFormatDayItinerary(newDayItinerary)];
    
    // 3. Remove the place from the saved list
    const updatedSavedPlaces = trip.saved_places.filter(p => p.fsq_id !== place.fsq_id);

    // 4. Update the database with both changes
    const { error } = await supabase.from('trip_plans').update({ itinerary: newFullItinerary, saved_places: updatedSavedPlaces }).eq('id', tripId);
    if (error) {
      console.error("Error moving saved place:", error);
      return { success: false, error: error.message };
    }

    // 5. Update local state
    set(state => ({
      tripPlans: state.tripPlans.map(p =>
        p.id === tripId ? { ...p, itinerary: newFullItinerary, saved_places: updatedSavedPlaces } : p
      )
    }));
    return { success: true };
  },
}));