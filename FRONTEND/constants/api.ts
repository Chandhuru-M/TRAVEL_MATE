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
    API_KEY: "your_openweather_api_key_here", // Replace with your actual OpenWeather API key
    BASE_URL: "https://api.openweathermap.org/data/2.5"
  },
  
  // Supabase Configuration
  SUPABASE: {
    URL: "your_supabase_url_here", // Replace with your actual Supabase URL
    ANON_KEY: "your_supabase_anon_key_here" // Replace with your actual Supabase anon key
  },
  
  // Firebase Configuration
  FIREBASE: {
    API_KEY: "your_firebase_api_key_here", // Replace with your actual Firebase API key
    AUTH_DOMAIN: "your_firebase_auth_domain_here",
    PROJECT_ID: "your_firebase_project_id_here",
    STORAGE_BUCKET: "your_firebase_storage_bucket_here",
    MESSAGING_SENDER_ID: "your_firebase_messaging_sender_id_here",
    APP_ID: "your_firebase_app_id_here"
  }
};

// Helper function to get Foursquare headers
export const getFoursquareHeaders = () => ({
  "accept": "application/json",
  "Authorization": `Bearer ${API_CONFIG.FOURSQUARE.API_KEY}`,
  "X-Places-Api-Version": API_CONFIG.FOURSQUARE.API_VERSION
});
