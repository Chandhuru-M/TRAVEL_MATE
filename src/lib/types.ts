
// --- FOURSQUARE / MOCK DATA TYPES ---
export interface LatLng {
lat: number;
lng: number;
}
export interface Place {
  id?: string;
  fsq_id: string;
  // mirrors web shape
  fsq_place_id?: string;
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
  address?: any;
  category?: any;
  details?: any;
  latitude?: any;
  longitude?: any;
  lat?: any;
  lng?: any;
  link?: string;
  related_places?: any;
  social_media?: any;
  tel?: string;
  website?: string;
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
type: 'attraction' | 'hotel' | 'restaurant' | 'travel' | 'default'; // <-- NEW 'default' TYPE
place?: Place;
travelDetails?: {
from: string;
to: string;
mode: 'car' | 'walk' | 'transit';
estimatedDuration: number; // in minutes
};
notes?: string;
isDefault: boolean; // <-- NEW FLAG
defaultType?: 'breakfast' | 'lunch' | 'dinner' | 'sleep'; // <-- NEW PROPERTY
}
// A new type for a single budget item
export interface BudgetItem {
id: string;
day: number; // Which day of the trip this budget is for
category: 'Food' | 'Accommodation' | 'Transport' | 'Activities' | 'Other';
description: string; // e.g., "Museum Tickets", "Dinner at Le Relais"
plannedAmount: number; // The amount the user plans to spend
}
// The enhanced budget object
export interface TripBudget {
totalAmount: number;
spentAmount: number;
currency: string;
// The new detailed breakdown
items: BudgetItem[];
}
export interface TripPlan {
id: string;
user_id: string;
name: string;
destination: string;
dates: { start: string; end: string; };
budget: TripBudget; // Use the new, more detailed budget type
itinerary: ItineraryItem[];
saved_places: Place[];
status: 'planning' | 'active' | 'completed';
}