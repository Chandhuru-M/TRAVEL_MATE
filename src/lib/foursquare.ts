import axios from 'axios';
import { Place } from './types';

const API_KEY = process.env.EXPO_PUBLIC_FOURSQUARE_API_KEY;
const BASE_URL = 'https://places-api.foursquare.com/places/search';

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
    Authorization: `Bearer ${API_KEY}`,
    'X-Places-Api-Version': '2025-06-17',
  };

  try {
    console.log(url);
    const response = await axios.get("https://places-api.foursquare.com/places/search",{
      headers
    });
    console.log(response.data);    
    const data:any = response.data;
    return data.results || data; 
  } catch (error:any) {
    console.error('Failed to fetch from Foursquare:', error);
    throw error;
  }
}


