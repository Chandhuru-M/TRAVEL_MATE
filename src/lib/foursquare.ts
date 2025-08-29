// src/lib/foursquare.ts
import axios from 'axios';
import { Place } from './types';
import * as Location from 'expo-location';

// Read service key and version from env (Expo should replace these at build time)
const SERVICE_KEY = process.env.EXPO_PUBLIC_FOURSQUARE_API_KEY;
const API_VERSION = process.env.EXPO_PUBLIC_FOURSQUARE_API_VERSION || '2025-06-17';

const BASE = 'https://places-api.foursquare.com';

function ensureKey() {
  if (!SERVICE_KEY) {
    throw new Error('Foursquare Service Key is missing from .env file.');
  }
}

async function fsqSearch(params: Record<string, string>) {
  ensureKey();
  const qs = new URLSearchParams(params).toString();
  const url = `${BASE}/places/search?${qs}`;

  const headers = {
    accept: 'application/json',
    Authorization: `Bearer ${SERVICE_KEY}`,
    'X-Places-Api-Version': API_VERSION,
  } as Record<string, string>;

  try {
  console.log('[fsqSearch] GET', url);
  console.log('[fsqSearch] headers:', { 'Authorization': 'Bearer ****', 'X-Places-Api-Version': API_VERSION });
  const res = await axios.get(url, { headers });
  console.log('[fsqSearch] status', res.status, 'bodyKeys', Object.keys(res.data || {}).slice(0,6));
  return res.data;
  } catch (err: any) {
    if (err.response) {
      console.error('[fsqSearch] Foursquare API Error:', err.response.status, err.response.data);
    } else {
      console.error('[fsqSearch] Request failed:', err.message);
    }
    throw err;
  }
}

interface FetchPlacesParams {
  lat: number;
  lon: number;
  query?: string;
  limit?: number;
  radius?: number;
}

export async function fetchPlaces(params: FetchPlacesParams): Promise<Place[]> {
  const { lat, lon, query = 'popular places', limit = 10, radius = 10000 } = params;

  const searchParams: Record<string, string> = {
    ll: `${lat},${lon}`,
    limit: String(limit),
    radius: String(radius),
    query,
  };

  const data: any = await fsqSearch(searchParams);
  const results = data.results || [];
  console.log('[fetchPlaces] searchParams:', searchParams, 'resultsCount:', results.length);
  if (results.length > 0) {
    console.log('[fetchPlaces] firstResultKeys:', Object.keys(results[0]).slice(0, 20));
  }

  // Map Foursquare response to the mobile Place type
  const places: Place[] = results.map((p: any) => ({
    fsq_id: p.fsq_id || p.fsq_place_id || p.id,
    name: p.name,
    // mobile expects categories as array of objects with name
    categories: (p.categories || []).map((c: any) => ({ name: c.name })),
    distance: p.distance,
    location: {
      formatted_address: p.location?.formatted_address || p.location?.formatted || 'No address',
      ...p.location,
    },
    geocodes: p.geocodes,
    rating: p.rating ?? undefined,
    price: p.price ?? undefined,
    photos: p.photos ?? undefined,
  }));

  return places;
}

// Convenience helper: fetch places near the current device location.
// This centralizes permission checks and fallbacks so callers don't need to pass lat/lon.
export async function fetchPlacesNearby(options?: { query?: string; limit?: number; radius?: number; }): Promise<Place[]> {
  const { query, limit, radius } = options || {};

  // Request permission first (will be a no-op if already granted)
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission not granted');
  }

  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    throw new Error('Location services are disabled on this device');
  }

  // Try to get the current position; fallback to last known position if necessary
  let loc: Location.LocationObject | null = null;
  try {
    loc = await Location.getCurrentPositionAsync({});
  } catch (err) {
    // fall back to last known position
    try {
      loc = await Location.getLastKnownPositionAsync();
    } catch (_) {
      loc = null;
    }
  }

  if (!loc || !loc.coords) {
    throw new Error('Current location is unavailable');
  }

  return fetchPlaces({ lat: loc.coords.latitude, lon: loc.coords.longitude, query, limit, radius });
}

// Return the current device coordinates (latitude, longitude)
export async function getDeviceLocation(): Promise<{ latitude: number; longitude: number }> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Location permission not granted');

  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) throw new Error('Location services are disabled on this device');

  let loc: Location.LocationObject | null = null;
  try {
    loc = await Location.getCurrentPositionAsync({});
  } catch (err) {
    try {
      loc = await Location.getLastKnownPositionAsync();
    } catch (_) {
      loc = null;
    }
  }

  if (!loc || !loc.coords) throw new Error('Current location is unavailable');
  return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
}

// Fetch detailed place information by fsq_id
export async function fetchPlaceDetails(fsq_id: string): Promise<any> {
  ensureKey();
  if (!fsq_id) throw new Error('fsq_id is required');

  const url = `${BASE}/places/${encodeURIComponent(fsq_id)}`;
  const headers = {
    accept: 'application/json',
    Authorization: `Bearer ${SERVICE_KEY}`,
    'X-Places-Api-Version': API_VERSION,
  } as Record<string, string>;

  try {
    const res = await axios.get(url, { headers });
    // return the raw response so callers can map as needed
    return res.data;
  } catch (err: any) {
    if (err.response) {
      console.error('[fetchPlaceDetails] Foursquare API Error:', err.response.status, err.response.data);
    } else {
      console.error('[fetchPlaceDetails] Request failed:', err.message);
    }
    throw err;
  }
}