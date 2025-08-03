import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

// Define the shape of the location data and error state
interface LocationState {
  location: Location.LocationObject | null;
  errorMsg: string | null;
  isLoading: boolean;
}

/**
 * A custom hook to get the user's current location.
 * It handles permission requests and provides location data, loading, and error states.
 */
export const useLocation = (): LocationState => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const getLocation = async () => {
      setIsLoading(true);

      // 1. Request foreground permissions from the user
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied. Please enable it in your device settings.');
        setIsLoading(false);
        return;
      }

      // 2. Get the current location
      try {
        // getCurrentPositionAsync is faster but less accurate.
        // For higher accuracy, you can adjust the options.
        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(currentLocation);
        setErrorMsg(null);
      } catch (error) {
        setErrorMsg('Could not fetch location. Please ensure your GPS is enabled.');
      } finally {
        setIsLoading(false);
      }
    };

    getLocation();

    // Note: If you need to continuously track the user, you would use
    // Location.watchPositionAsync() here and return a cleanup function.
    // For most "find nearby" features, a one-time fetch is sufficient.

  }, []); // The empty dependency array ensures this runs once on mount

  return { location, errorMsg, isLoading };
};