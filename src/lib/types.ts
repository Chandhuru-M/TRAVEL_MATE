// src/lib/types.ts

// --- FOURSQUARE / MOCK DATA TYPES ---
export interface LatLng {
  lat: number;
  lng: number;
}

export interface Place {
  fsq_id: string;
  name: string;
  categories: { name: string }[];
  distance?: number;
  location?: {
    formatted_address?: string;
    address?: string;
    locality?: string;
  };
  geocodes?: {
    main?: LatLng;
  };
  rating?: number;
  price?: number;
  photos?: { prefix: string; suffix: string }[];
}


// --- FINANCE / WALLET TYPES ---
export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: 'bank_account' | 'credit_card' | 'cash' | 'e-wallet';
  balance: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  trip_id: string | null;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  timestamp: string;
}

export interface ItineraryItem {
  id: string;
  day: number;
  startTime: string; // "09:00"
  endTime: string;   // "12:00"
  type: 'attraction' | 'hotel' | 'restaurant' | 'travel';
  place?: Place;
  travelDetails?: {
    from: string;
    to: string;
    mode: 'car' | 'walk' | 'transit';
    estimatedDuration: number; // in minutes
  };
  notes?: string;
}

export interface TripPlan {
  id: string;
  user_id: string;
  name: string;
  destination: string;
  dates: { start: string; end: string; };
  budget: { totalAmount: number; spentAmount: number; currency: string; };
  itinerary: ItineraryItem[];
  saved_places: Place[];
  status: 'planning' | 'active' | 'completed';
}