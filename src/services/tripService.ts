// src/services/tripService.ts
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { TripPlan } from '@/lib/types';

interface TripState {
  isLoaded: boolean;
  tripPlans: TripPlan[];
  activeTripPlanId: string | null;
  fetchTripPlans: () => Promise<void>;
  createTripPlan: (details: {
    name: string;
    destination: string;
    dates: { start: string; end: string };
    budget: { totalAmount: number; currency: string };
  }) => Promise<void>;
  setActiveTripPlan: (tripId: string | null) => void;
}

export const useTripStore = create<TripState>((set, get) => ({
  isLoaded: false,
  tripPlans: [],
  activeTripPlanId: null,

  fetchTripPlans: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.from('trip_plans').select('*').order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching trip plans:", error);
    } else {
      set({ tripPlans: data as TripPlan[], isLoaded: true }); // Cast data to our TripPlan type
    }
  },

  createTripPlan: async (details) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newPlanData = {
      ...details,
      user_id: user.id,
      budget: { ...details.budget, spentAmount: 0 },
      saved_places: [], // Match the DB column name
      status: 'planning',
    };

    const { data: newPlan, error } = await supabase
      .from('trip_plans')
      .insert(newPlanData)
      .select()
      .single();
    
    if (newPlan) {
      set(state => ({ tripPlans: [newPlan as TripPlan, ...state.tripPlans] }));
    } else {
      console.error("Error creating trip plan:", error);
    }
  },

  setActiveTripPlan: (tripId) => {
    set({ activeTripPlanId: tripId });
  },
}));