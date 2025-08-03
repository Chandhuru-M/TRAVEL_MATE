import axios from 'axios';
import { auth } from './firebase'; // Import the initialized auth service from your firebase.ts

// IMPORTANT: Use an environment variable for your backend API's base URL.
// This allows you to easily switch between a local development server and a live production server.
// In your .env file:
// For local development: EXPO_PUBLIC_API_URL="http://192.168.1.10:8000/api" (use your computer's local IP)
// For production: EXPO_PUBLIC_API_URL="https://your-live-api.com/api"
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// Create the main axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Axios Request Interceptor ---
// This function will run before every single request sent using this 'api' instance.
api.interceptors.request.use(
  async (config) => {
    // Get the current logged-in user from Firebase Auth
    const user = auth.currentUser;

    if (user) {
      try {
        // Get the Firebase ID token for the current user.
        // This token is a secure JWT that your backend can verify.
        // The `true` argument forces a refresh if the token is expired.
        const token = await user.getIdToken(true);

        // If a token is successfully retrieved, add it to the Authorization header.
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Could not get auth token for API request:", error);
        // You might want to handle this error, e.g., by logging the user out.
      }
    }
    
    // Return the modified config object to proceed with the request
    return config;
  },
  (error) => {
    // Handle any errors that occur during the request setup
    return Promise.reject(error);
  }
);

// --- Axios Response Interceptor (Optional but Recommended) ---
// This can be used to handle global API errors, like a 401 Unauthorized response.
api.interceptors.response.use(
  (response) => {
    // If the request was successful, just return the response
    return response;
  },
  (error) => {
    // If the error is a 401 Unauthorized, it might mean the user's session is invalid.
    // You could automatically log them out here.
    if (error.response && error.response.status === 401) {
      console.log("Unauthorized request. User session may be invalid. Logging out.");
      // auth.signOut(); // This would log the user out globally
    }
    
    // Reject the promise to propagate the error to the calling function
    return Promise.reject(error);
  }
);


export default api;

// --- Example Usage (do not include this in the file, for understanding only) ---
/*
  import api from './lib/api';

  const sendChatMessage = async (message: string) => {
    try {
      // You don't need to worry about headers here. The interceptor handles it.
      const response = await api.post('/chat', { message });
      return response.data;
    } catch (error) {
      console.error("Failed to send chat message:", error);
      throw error;
    }
  }
*/