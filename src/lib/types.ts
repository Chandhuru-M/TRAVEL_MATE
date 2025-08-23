// src/lib/types.ts

// --- EXISTING FOURSQUARE/PLACE TYPES ---

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


// --- NEW, ROBUST DATA MODELS FOR TRIP PLANNING & WALLET ---

/**
 * Represents a single financial transaction within the app.
 * Can be linked to a specific trip or the general wallet.
 */
export interface Transaction {
  id: string;
  tripId: string | 'wallet'; // Links to a TripPlan ID or the general wallet
  amount: number;
  description: string;
  type: 'credit' | 'debit';
  timestamp: string; // ISO 8601 format string for easy storage and parsing
}

/**
 * Represents a single, complete Trip Plan created by the user.
 * This is the central data model for the app's core functionality.
 */
export interface TripPlan {
  id: string;
  name: string;
  destination: string;
  dates: {
    start: string; // ISO 8601 format string
    end: string;   // ISO 8601 format string
  };
  budget: {
    totalAmount: number;
    spentAmount: number;
    currency: string; // e.g., 'INR', 'USD'
  };
  savedPlaces: Place[];
  // You can add more complex types for bookings later
  // bookedHotels: Booking[];
  // bookedFlights: Booking[];
  status: 'planning' | 'active' | 'completed';
}