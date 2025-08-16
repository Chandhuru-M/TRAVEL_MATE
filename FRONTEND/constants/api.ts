// API Configuration
// This file contains API keys and endpoints for the application

export const API_CONFIG = {
  // Foursquare API Configuration
  FOURSQUARE: {
    API_KEY: "IZVC5N1FFMBJG1K45PWMYT1JZBVT2BBMPSSHBVXI2GLGQECS",
    BASE_URL: "https://places-api.foursquare.com",
    API_VERSION: "2025-06-17"
  },
  
  // OpenWeather API Configuration
  OPENWEATHER: {
    API_KEY: "88b94965b8d3ac08524938bf0b195614",
    BASE_URL: "https://api.openweathermap.org/data/2.5"
  },
  
  // Supabase Configuration
  SUPABASE: {
    URL: "https://knkxlzqwtmiikxrqqylu.supabase.co", // Replace with your actual Supabase URL
    ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtua3hsenF3dG1paWt4cnFxeWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzU0NzksImV4cCI6MjA2OTkxMTQ3OX0.LJGNhGCLtlNxhvBOOyI52qiO2cmsLKpzYlKo4fik-b8" // Replace with your actual Supabase anon key
  },
  
  // Firebase Configuration
  FIREBASE: {
    API_KEY: "AIzaSyBgz7wpg1nkXZ9uuHyCgLRwAfZ_FzFAlJA", // Replace with your actual Firebase API key
    AUTH_DOMAIN: "travelmate-07chss.firebaseapp.com",
    PROJECT_ID: "travelmate-07chss",
    STORAGE_BUCKET: "travelmate-07chss.firebasestorage.app",
    MESSAGING_SENDER_ID: "985002644614",
    APP_ID: "1:985002644614:web:bba90799c119c92ef76d07e",
    databaseURL: "https://travelmate-07chss-default-rtdb.asia-southeast1.firebasedatabase.app/"
  }
};

// Helper function to get Foursquare headers
export const getFoursquareHeaders = () => ({
  "accept": "application/json",
  "Authorization": `Bearer ${API_CONFIG.FOURSQUARE.API_KEY}`,
  "X-Places-Api-Version": API_CONFIG.FOURSQUARE.API_VERSION
});
