// src/lib/types.ts

export interface LatLng { /* ... */ }
export interface Place { /* ... */ }

// --- CORRECTED DATA MODELS ---

export interface Account {
  id: string; // Was missing from some logic
  user_id: string;
  name: string;
  type: 'bank_account' | 'credit_card' | 'cash' | 'e-wallet';
  balance: number; // Was missing from some logic
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string; // Matched to DB
  trip_id: string | null; // Matched to DB
  description: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  timestamp: string;
}

export interface TripPlan {
  id: string;
  user_id: string;
  name: string;
  destination: string;
  dates: { start: string; end: string; };
  budget: { totalAmount: number; spentAmount: number; currency: string; };
  saved_places: Place[];
  status: 'planning' | 'active' | 'completed';
}