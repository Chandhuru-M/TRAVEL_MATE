// src/services/tripService.ts
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { TripPlan } from '@/lib/types';

interface TripState {
  isLoaded: boolean; // <-- THE MISSING PROPERTY
  tripPlans: TripPlan[];
  activeTripPlanId: string | null;
  fetchTripPlans: () => Promise<void>;
  createTripPlan: (details: any) => Promise<void>;
  setActiveTripPlan: (tripId: string | null) => void;
}

export const useTripStore = create<TripState>((set, get) => ({
  isLoaded: false, // <-- INITIALIZE THE STATE
  tripPlans: [],
  activeTripPlanId: null,

  fetchTripPlans: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ isLoaded: true }); // If no user, we are "loaded" but have no data
      return;
    }

    const { data, error } = await supabase.from('trip_plans').select('*').order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching trip plans:", error);
    } else {
      set({ tripPlans: (data as TripPlan[]) || [], isLoaded: true });
    }
  },

  createTripPlan: async (details) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const newPlanData = {
      ...details,
      user_id: user.id,
      budget: { ...details.budget, spentAmount: 0 },
      itinerary: [],
      saved_places: [],
      status: 'planning',
    };
    const { data: newPlan } = await supabase.from('trip_plans').insert(newPlanData).select().single();
    if (newPlan) {
      set(state => ({ tripPlans: [newPlan as TripPlan, ...state.tripPlans] }));
    }
  },

  setActiveTripPlan: (tripId) => {
    set({ activeTripPlanId: tripId });
  },
}));