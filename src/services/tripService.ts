// src/services/tripService.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TripPlan, Place } from '../lib/types';
import uuid from 'react-native-uuid';

interface TripState {
  tripPlans: TripPlan[];
  activeTripPlanId: string | null;
}

interface TripActions {
  createTripPlan: (details: {
    name: string;
    destination: string;
    dates: { start: string; end: string };
    budget: { totalAmount: number; currency: string };
  }) => TripPlan;
  getTripPlanById: (tripId: string) => TripPlan | undefined;
  updateTripPlan: (tripId: string, updatedDetails: Partial<TripPlan>) => void;
  deleteTripPlan: (tripId: string) => void;
  setActiveTripPlan: (tripId: string | null) => void;
  getActiveTripPlan: () => TripPlan | undefined;
  savePlaceToTrip: (tripId: string, place: Place) => { success: boolean; error?: string };
  recordExpenseForTrip: (tripId: string, expense: { amount: number; description: string }) => { success: boolean; error?: string };
}

export const useTripStore = create<TripState & TripActions>()(
  persist(
    (set, get) => ({
      tripPlans: [],
      activeTripPlanId: null,

      createTripPlan: (details) => {
        const newTripPlan: TripPlan = {
          ...details,
          id: uuid.v4() as string,
          // HERE, we create the full, valid budget object by adding spentAmount: 0
          budget: {
            ...details.budget,
            spentAmount: 0,
          },
          savedPlaces: [],
          status: 'planning',
        };
        set((state) => ({ tripPlans: [...state.tripPlans, newTripPlan] }));
        return newTripPlan;
      },

      getTripPlanById: (tripId) => {
        return get().tripPlans.find((plan) => plan.id === tripId);
      },
      updateTripPlan: (tripId, updatedDetails) => {
        set((state) => ({
          tripPlans: state.tripPlans.map((plan) =>
            plan.id === tripId ? { ...plan, ...updatedDetails } : plan
          ),
        }));
      },
      deleteTripPlan: (tripId) => {
        set((state) => ({
          tripPlans: state.tripPlans.filter((plan) => plan.id !== tripId),
          activeTripPlanId: state.activeTripPlanId === tripId ? null : state.activeTripPlanId,
        }));
      },
      setActiveTripPlan: (tripId) => {
        set({ activeTripPlanId: tripId });
      },
      getActiveTripPlan: () => {
        const activeId = get().activeTripPlanId;
        if (!activeId) return undefined;
        return get().tripPlans.find((plan) => plan.id === activeId);
      },
      savePlaceToTrip: (tripId, place) => {
        const plan = get().getTripPlanById(tripId);
        if (!plan) { return { success: false, error: 'Trip plan not found.' }; }
        if (plan.savedPlaces.some(p => p.fsq_id === place.fsq_id)) { return { success: true }; }
        const updatedPlan = { ...plan, savedPlaces: [...plan.savedPlaces, place] };
        get().updateTripPlan(tripId, updatedPlan);
        return { success: true };
      },
      recordExpenseForTrip: (tripId, expense) => {
        const plan = get().getTripPlanById(tripId);
        if (!plan) { return { success: false, error: 'Trip plan not found.' }; }
        if (plan.budget.spentAmount + expense.amount > plan.budget.totalAmount) {
          return { success: false, error: 'This expense exceeds your budget for this trip.' };
        }
        const updatedPlan = {
          ...plan,
          budget: { ...plan.budget, spentAmount: plan.budget.spentAmount + expense.amount },
        };
        get().updateTripPlan(tripId, updatedPlan);
        return { success: true };
      },
    }),
    {
      name: 'travelmate-trip-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);