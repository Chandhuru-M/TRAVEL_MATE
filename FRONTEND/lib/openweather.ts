import axios from 'axios';

// IMPORTANT: Use environment variables for your API key.
// In your .env file:
// EXPO_PUBLIC_OPENWEATHER_API_KEY="..."
const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Define a clean shape for the weather data we want to use in the app
export interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
  locationName: string;
}

/**
 * Fetches the current weather for a given location.
 * @param lat - Latitude of the user.
 * @param lon - Longitude of the user.
 * @returns A promise that resolves with a cleaned-up WeatherData object or null.
 */
export const getCurrentWeather = async (lat: number, lon: number): Promise<WeatherData | null> => {
  if (!OPENWEATHER_API_KEY) {
    console.error("OpenWeatherMap API key is missing.");
    return null;
  }

  try {
    const response = await axios.get(API_URL, {
      params: {
        lat,
        lon,
        appid: OPENWEATHER_API_KEY,
        units: 'imperial', // Use 'metric' for Celsius
      },
    });

    const data = response.data;

    // Transform the raw API data into our clean WeatherData format
    const weatherData: WeatherData = {
      temperature: Math.round(data.main.temp),
      condition: data.weather[0]?.main || 'Clear', // e.g., 'Clouds', 'Rain'
      icon: data.weather[0]?.icon || '01d', // e.g., '01d' for clear day
      locationName: data.name,
    };

    return weatherData;
  } catch (error) {
    console.error('Error fetching OpenWeatherMap data:', error);
    return null;
  }
};