import axios from 'axios';

const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

export interface WeatherData {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: {
    main: string;
    description: string;
  }[];
  wind: {
    speed: number;
  };
  name: string;
}

export async function getWeather(lat: number, lon: number): Promise<WeatherData> {
  if (!API_KEY) {
    throw new Error('OpenWeather API key is not defined.');
  }

  try {
    const response = await axios.get<WeatherData>(BASE_URL, {
      params: {
        lat,
        lon,
        appid: API_KEY,
        units: 'metric',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw new Error('Failed to fetch weather data.');
  }
}
