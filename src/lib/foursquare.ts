import axios from 'axios';
import { Place } from './types';

const API_KEY = process.env.EXPO_PUBLIC_FOURSQUARE_API_KEY || (process as any)?.env?.FOURSQUARE_API_KEY || process.env.NEXT_PUBLIC_FOURSQUARE_API_KEY;
// Official v3 Places API endpoint (Authorization header must be the raw fsq3... token; no "Bearer")
const BASE_URL = 'https://api.foursquare.com/v3/places/search';
const API_VERSION = process.env.EXPO_PUBLIC_FOURSQUARE_API_VERSION || '2025-06-17';

interface FetchPlacesParams {
  lat: number;
  lon: number;
  query?: string;
  limit?: number;
  radius?: number;  
}

export async function fetchPlaces(params: FetchPlacesParams): Promise<Place[]> {
  const {
    lat,
    lon,
    query = 'tourist attraction',
    limit = 10,
    radius = 10000,
  } = params;

  if (!API_KEY) {
    throw new Error('Foursquare API key is missing.');
  }

  const url = `${BASE_URL}?ll=${lat},${lon}&query=${encodeURIComponent(
    query
  )}&limit=${limit}&radius=${radius}&fields=fsq_id,name,categories,distance,location,geocodes,rating,price,photos`;

  const headers = {
    Accept: 'application/json',
    Authorization: `${API_KEY}`,
    'X-Places-Api-Version': API_VERSION,
  };

  try {
    const response = await axios.get(url, { headers });
    const data:any = response.data;
    const results = data?.results || [];
    // normalize to Place[] shape if needed
    return results.map((p: any) => ({
      fsq_id: p.fsq_id,
      name: p.name,
      categories: p.categories ?? [],
      distance: p.distance,
      location: p.location,
      geocodes: p.geocodes,
      rating: p.rating,
      price: p.price,
      photos: p.photos,
    })) as Place[];
  } catch (error:any) {
    console.error('Failed to fetch from Foursquare:', error);
    throw error;
  }
}

// Simple search helper aligned with the user-provided Python example
export async function searchPlacesBasic(params: { lat: number; lon: number; query: string; limit?: number; radius?: number }) {
  const { lat, lon, query, limit = 6, radius = 6000 } = params;
  if (!API_KEY) throw new Error('Foursquare API key is missing.');
  const fields = 'fsq_id,name,geocodes,location,categories,rating,distance,price,hours,tel,website';
  const url = `${BASE_URL}?ll=${lat},${lon}&query=${encodeURIComponent(query)}&limit=${limit}&radius=${radius}&sort=DISTANCE&fields=${encodeURIComponent(fields)}`;
  const headers = {
    accept: 'application/json',
    Authorization: `${API_KEY}`,
    'X-Places-Api-Version': API_VERSION,
  } as const;
  const res = await fetch(url, { headers: headers as any });
  if (!res.ok) {
    // Try to parse error body for details
    let details: any = undefined;
    try { details = await res.json(); } catch {}
    if (res.status === 429) throw new Error('FSQ_RATE_LIMIT');
    const msg = details?.message || details?.error || JSON.stringify(details || {});
    throw new Error(`Foursquare error ${res.status}${msg ? `: ${msg}` : ''}`);
  }
  const data: any = await res.json();
  const results = data?.results || [];
  // Return a компакт normalized array (id, name, lat/lng, address, rating if present)
  return results.map((p: any) => ({
    id: p.fsq_id,
    name: p.name,
    latitude: p?.geocodes?.main?.latitude ?? p?.geocodes?.main?.lat,
    longitude: p?.geocodes?.main?.longitude ?? p?.geocodes?.main?.lng,
    address: p?.location?.formatted_address || p?.location?.address || '',
    category: p?.categories?.[0]?.name,
    rating: typeof p?.rating === 'number' ? p.rating : undefined,
    phone: p?.tel,
    website: p?.website,
    priceLevel: typeof p?.price === 'number' ? p.price : undefined,
    openNow: p?.hours?.open_now,
    hours: p?.hours?.display,
  }));
}

export async function searchPlacesByParams(params: { lat: number; lon: number; query?: string; categories?: string[]; limit?: number; radius?: number }) {
  const { lat, lon, query, categories, limit = 6, radius = 6000 } = params;
  if (!API_KEY) throw new Error('Foursquare API key is missing.');
  const fields = 'fsq_id,name,geocodes,location,categories,rating,distance,price,hours,tel,website';
  const url = new URL(BASE_URL);
  url.searchParams.set('ll', `${lat},${lon}`);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('radius', String(radius));
  url.searchParams.set('sort', 'DISTANCE');
  url.searchParams.set('fields', fields);
  if (query) url.searchParams.set('query', query);
  if (categories && categories.length) url.searchParams.set('categories', categories.join(','));
  const headers = {
    accept: 'application/json',
    Authorization: `${API_KEY}`,
    'X-Places-Api-Version': API_VERSION,
  } as const;
  const res = await fetch(url.toString(), { headers: headers as any });
  if (!res.ok) {
    let details: any = undefined;
    try { details = await res.json(); } catch {}
    if (res.status === 429) throw new Error('FSQ_RATE_LIMIT');
    const msg = details?.message || details?.error || JSON.stringify(details || {});
    throw new Error(`Foursquare error ${res.status}${msg ? `: ${msg}` : ''}`);
  }
  const data: any = await res.json();
  const results = data?.results || [];
  return results.map((p: any) => ({
    id: p.fsq_id,
    name: p.name,
    latitude: p?.geocodes?.main?.latitude ?? p?.geocodes?.main?.lat,
    longitude: p?.geocodes?.main?.longitude ?? p?.geocodes?.main?.lng,
    address: p?.location?.formatted_address || p?.location?.address || '',
    category: p?.categories?.[0]?.name,
    rating: typeof p?.rating === 'number' ? p.rating : undefined,
    phone: p?.tel,
    website: p?.website,
    priceLevel: typeof p?.price === 'number' ? p.price : undefined,
    openNow: p?.hours?.open_now,
    hours: p?.hours?.display,
  }));
}


