import axios from 'axios';
import { API_CONFIG } from '../constants/api';

// Use API configuration instead of environment variables
const FOURSQUARE_API_KEY = API_CONFIG.FOURSQUARE.API_KEY;
const API_URL = 'https://places-api.foursquare.com/places';

const foursquareApi = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: 'application/json',
    Authorization: `Bearer ${FOURSQUARE_API_KEY}`,
    'X-Places-Api-Version': API_CONFIG.FOURSQUARE.API_VERSION,
  },
});

/**
 * Fetches nearby places from the Foursquare API based on location and category.
 * @param lat - Latitude of the user.
 * @param lon - Longitude of the user.
 * @param categories - A comma-separated string of category IDs (e.g., '13065' for restaurants).
 * @param radius - Search radius in meters.
 * @returns A promise that resolves with an array of place objects.
 */
export const getNearbyPlaces = async (lat: number, lon: number, categories: string, radius: number = 5000) => {
  if (!FOURSQUARE_API_KEY) {
    console.error("Foursquare API key is missing.");
    return []; // Return empty array if key is not set
  }

  try {
    const response = await foursquareApi.get('/search', {
      params: {
        ll: `${lat},${lon}`,
        categories,
        radius,
        sort: 'DISTANCE',
        limit: 20, // Fetch up to 20 places
      },
    });
    return response.data.results || [];
  } catch (error) {
    console.error('Error fetching Foursquare data:', error);
    // You might want to handle different error types (e.g., network vs. API error)
    return [];
  }
};

/**
 * Fetches detailed information for a single place.
 * @param fsqId - The Foursquare ID of the place.
 * @returns A promise that resolves with the detailed place object.
 */
export const getPlaceDetails = async (fsqId: string) => {
  if (!FOURSQUARE_API_KEY) {
    console.error("Foursquare API key is missing.");
    return null;
  }

  try {
    const response = await foursquareApi.get(`/${fsqId}`, {
        params: {
            fields: 'fsq_id,name,location,rating,price,photos,tips' // Specify fields you need
        }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching details for place ${fsqId}:`, error);
    return null;
  }
};