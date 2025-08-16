// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';
// import { Colors, sizes } from '@/constants';
// import * as Location from 'expo-location';
// import { API_CONFIG, getFoursquareHeaders } from '../../constants/api';

// // --- Components (can be moved to their own files later) ---
// const PlaceCard = ({ place, onPress }: { place: any; onPress?: () => void }) => (
//     <TouchableOpacity style={styles.placeCard} onPress={onPress}>
//       <Image 
//         source={{ 
//           uri: place.photos?.[0]?.prefix + '300x300' + place.photos?.[0]?.suffix || 
//                 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'
//         }} 
//         style={styles.placeImage} 
//       />
//       <View style={styles.placeInfo}>
//         <Text style={styles.placeName}>{place.name}</Text>
//         <Text style={styles.placeCategory}>{place.categories?.[0]?.name || 'Place'}</Text>
//         <View style={styles.placeDetails}>
//           <Ionicons name="star" color={Colors.light.accent} size={16} />
//           <Text style={styles.placeRating}>{place.rating?.toFixed(1) || 'N/A'}</Text>
//           <Text style={styles.placeDistance}> • {Math.round(place.distance)}m</Text>
//         </View>
//         {place.location?.formatted_address && (
//           <Text style={styles.placeAddress} numberOfLines={1}>
//             {place.location.formatted_address}
//           </Text>
//         )}
//       </View>
//       <View style={styles.placePriceContainer}>
//         <Text style={styles.placePrice}>
//           {place.price ? '💰'.repeat(place.price) : '💡'}
//         </Text>
//       </View>
//     </TouchableOpacity>
//   );

// // --- Main Screen ---
// const ExploreScreen = () => {
//     const [places, setPlaces] = useState<any[]>([]);
//     const [loading, setLoading] = useState(false);
//     const [activeFilter, setActiveFilter] = useState('All');
//     const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
//     const [error, setError] = useState<string | null>(null);
    
//     const filters = ['All', 'Restaurants', 'Hotels', 'Gas', 'Attractions'];
    
//     // Category mapping for Foursquare API
//     const categoryMap: { [key: string]: string } = {
//       'Restaurants': '13065', // Food category
//       'Hotels': '1904',       // Lodging category
//       'Gas': '17043',         // Gas stations
//       'Attractions': '10000'  // Arts & Entertainment
//     };

//     // Get user location
//     useEffect(() => {
//       (async () => {
//         try {
//           let { status } = await Location.requestForegroundPermissionsAsync();
//           if (status !== 'granted') {
//             setError('Location permission denied');
//             // Use default coordinates (Chennai) for web testing
//             setLocation({ latitude: 13.0827, longitude: 80.2707 });
//             return;
//           }
//           let loc = await Location.getCurrentPositionAsync({});
//           setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
//         } catch (error) {
//           console.error('Location error:', error);
//           setError('Location error: ' + (error as Error).message);
//           // Use default coordinates for web testing
//           setLocation({ latitude: 13.0827, longitude: 80.2707 });
//         }
//       })();
//     }, []);

//     // Fetch places from Foursquare API
//     const fetchPlaces = async (category: string = 'All') => {
//       if (!location) return;
      
//       setLoading(true);
//       setError(null);
      
//       try {
//         const url = `${API_CONFIG.FOURSQUARE.BASE_URL}/places/search`;
//         const headers = getFoursquareHeaders();
        
//         const params = new URLSearchParams({
//           "ll": `${location.latitude},${location.longitude}`,
//           "radius": "5000",
//           "limit": "20",
//           "sort": "RATING"
//         });
        
//         // Add category filter if not "All"
//         if (category !== 'All' && categoryMap[category]) {
//           params.append("categories", categoryMap[category]);
//         }
        
//         const response = await fetch(`${url}?${params}`, { headers });
        
//         if (response.ok) {
//           const data = await response.json();
//           const results = data.results || [];
          
//           // Transform Foursquare data to our format
//           const transformedPlaces = results.map((place: any) => ({
//             ...place,
//             id: place.fsq_id || place.id,
//             category: place.categories?.[0]?.name || 'Place',
//             rating: place.rating || 0,
//             distance: place.distance || 0,
//             price: place.price || null
//           }));
          
//           setPlaces(transformedPlaces);
//         } else {
//           const errorText = await response.text();
//           console.error("Foursquare API Error:", response.status, errorText);
//           setError('Failed to fetch places');
//         }
//       } catch (error) {
//         console.error("Network Error:", error);
//         setError('Network error occurred');
//       } finally {
//         setLoading(false);
//       }
//     };

//     // Fetch places when location changes or filter changes
//     useEffect(() => {
//       if (location) {
//         fetchPlaces(activeFilter);
//       }
//     }, [location, activeFilter]);

//     // Handle filter change
//     const handleFilterChange = (filter: string) => {
//       setActiveFilter(filter);
//       if (location) {
//         fetchPlaces(filter);
//       }
//     };

//     // Handle place selection
//     const handlePlacePress = (place: any) => {
//       Alert.alert(
//         place.name,
//         `Category: ${place.categories?.[0]?.name || 'Place'}\n` +
//         `Rating: ${place.rating?.toFixed(1) || 'N/A'}\n` +
//         `Distance: ${Math.round(place.distance)}m\n` +
//         `Address: ${place.location?.formatted_address || 'Not available'}`,
//         [
//           { text: 'Navigate', onPress: () => {
//             if (place.geocodes?.main?.latitude && place.geocodes?.main?.longitude) {
//               const url = `https://www.google.com/maps/dir/?api=1&destination=${place.geocodes.main.latitude},${place.geocodes.main.longitude}`;
//               // For web, you might want to use window.open or similar
//               console.log('Navigate to:', url);
//             }
//           }},
//           { text: 'Close', style: 'cancel' }
//         ]
//       );
//     };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <View style={styles.container}>
//         <View style={styles.headerContainer}>
//           <View>
//             <Text style={styles.title}>Explore Nearby</Text>
//             <Text style={styles.subtitle}>Find the best places around you</Text>
//           </View>
//           <TouchableOpacity 
//             style={styles.refreshButton} 
//             onPress={() => location && fetchPlaces(activeFilter)}
//             disabled={loading}
//           >
//             <Ionicons 
//               name="refresh" 
//               size={24} 
//               color={Colors.light.primary} 
//             />
//           </TouchableOpacity>
//         </View>

//         <View style={{ height: 70 }}>
//           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
//             {filters.map(filter => (
//               <TouchableOpacity
//                 key={filter}
//                 style={[styles.filterButton, activeFilter === filter && styles.filterActiveButton]}
//                 onPress={() => handleFilterChange(filter)}
//               >
//                 <Text style={[styles.filterText, activeFilter === filter && styles.filterActiveText]}>
//                   {filter}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </ScrollView>
//         </View>

//         {error && (
//           <View style={styles.errorContainer}>
//             <Text style={styles.errorText}>{error}</Text>
//           </View>
//         )}

//         {location && (
//           <Text style={styles.locationText}>
//             📍 Searching near: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
//           </Text>
//         )}

//         {loading ? (
//           <ActivityIndicator size="large" color={Colors.light.primary} style={{ marginTop: 50 }} />
//         ) : (
//           <FlatList
//             data={places}
//             renderItem={({ item }) => <PlaceCard place={item} onPress={() => handlePlacePress(item)} />}
//             keyExtractor={item => item.id}
//             showsVerticalScrollIndicator={false}
//             // THE FIX IS HERE: We add padding to the bottom of the content.
//             // This pushes the last item up so it's not hidden by the tab bar.
//             contentContainerStyle={{ paddingBottom: 120 }}
//             ListEmptyComponent={
//               !loading ? (
//                 <View style={styles.emptyContainer}>
//                   <Text style={styles.emptyText}>No places found in this category</Text>
//                   <Text style={styles.emptySubtext}>Try changing the filter or location</Text>
//                 </View>
//               ) : null
//             }
//           />
//         )}
//       </View>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//     safeArea: {
//       flex: 1,
//       backgroundColor: Colors.light.background,
//     },
//     container: {
//       flex: 1,
//       paddingHorizontal: sizes.spacing.md,
//     },
//     headerContainer: {
//       flexDirection: 'row',
//       justifyContent: 'space-between',
//       alignItems: 'flex-start',
//       marginTop: sizes.spacing.md,
//     },
//     refreshButton: {
//       padding: sizes.spacing.sm,
//       borderRadius: sizes.borderRadius.full,
//       backgroundColor: Colors.light.cardBackground,
//     },
//     title: {
//       fontSize: sizes.font.xxl,
//       fontWeight: 'bold',
//       color: Colors.light.text,
//       marginTop: sizes.spacing.md,
//     },
//     subtitle: {
//       fontSize: sizes.font.md,
//       color: Colors.light.textSecondary,
//       marginBottom: sizes.spacing.xs,
//     },
//     filterContainer: {
//       paddingVertical: sizes.spacing.md,
//     },
//     filterButton: {
//       paddingVertical: sizes.spacing.sm,
//       paddingHorizontal: sizes.spacing.lg,
//       marginRight: sizes.spacing.sm,
//       backgroundColor: Colors.light.cardBackground,
//       borderRadius: sizes.borderRadius.full,
//     },
//     filterActiveButton: {
//       backgroundColor: Colors.light.primary,
//     },
//     filterText: {
//       color: Colors.light.textSecondary,
//       fontWeight: '500',
//     },
//     filterActiveText: {
//       color: Colors.light.cardBackground,
//     },
//     placeCard: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       backgroundColor: Colors.light.cardBackground,
//       borderRadius: sizes.borderRadius.lg,
//       padding: sizes.spacing.md,
//       marginBottom: sizes.spacing.md,
//       shadowColor: '#000',
//       shadowOffset: { width: 0, height: 4 },
//       shadowOpacity: 0.07,
//       shadowRadius: 10,
//       elevation: 3,
//     },
//     placeImage: {
//       width: 80,
//       height: 80,
//       borderRadius: sizes.borderRadius.md,
//     },
//     placeInfo: {
//       flex: 1,
//       marginLeft: sizes.spacing.md,
//       justifyContent: 'center',
//     },
//     placeName: {
//       fontSize: sizes.font.lg,
//       fontWeight: 'bold',
//       color: Colors.light.text,
//     },
//     placeCategory: {
//       fontSize: sizes.font.sm,
//       color: Colors.light.textSecondary,
//       marginBottom: sizes.spacing.sm,
//     },
//     placeDetails: {
//       flexDirection: 'row',
//       alignItems: 'center',
//     },
//     placeRating: {
//       marginLeft: sizes.spacing.xs,
//       color: Colors.light.text,
//       fontWeight: 'bold',
//     },
//     placeDistance: {
//       color: Colors.light.textSecondary,
//     },
//     placeAddress: {
//       fontSize: sizes.font.sm,
//       color: Colors.light.textSecondary,
//       marginTop: sizes.spacing.xs,
//       fontStyle: 'italic',
//     },
//     placePriceContainer: {
//         justifyContent: 'flex-start',
//         alignItems: 'flex-end',
//         paddingLeft: sizes.spacing.sm,
//     },
//     placePrice: {
//         fontSize: sizes.font.md,
//         fontWeight: 'bold',
//         color: Colors.light.primary,
//     },
//     errorContainer: {
//       backgroundColor: '#fee2e2',
//       padding: sizes.spacing.sm,
//       borderRadius: sizes.borderRadius.md,
//       marginBottom: sizes.spacing.sm,
//       borderWidth: 1,
//       borderColor: '#fecaca',
//     },
//     errorText: {
//       color: '#dc2626',
//       fontSize: sizes.font.sm,
//       textAlign: 'center',
//       fontWeight: '500',
//     },
//     locationText: {
//       fontSize: sizes.font.sm,
//       color: Colors.light.textSecondary,
//       textAlign: 'center',
//       marginBottom: sizes.spacing.sm,
//       fontStyle: 'italic',
//     },
//     emptyContainer: {
//       alignItems: 'center',
//       justifyContent: 'center',
//       paddingVertical: sizes.spacing.xl * 2,
//     },
//     emptyText: {
//       fontSize: sizes.font.lg,
//       color: Colors.light.textSecondary,
//       fontWeight: '500',
//       marginBottom: sizes.spacing.sm,
//     },
//     emptySubtext: {
//       fontSize: sizes.font.sm,
//       color: Colors.light.textSecondary,
//       textAlign: 'center',
//     }
//   });

// export default ExploreScreen;
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
//import { API_CONFIG, getFoursquareHeaders } from "../constants/api"; // 👈 import config
import { API_CONFIG, getFoursquareHeaders } from "../../constants/api";

// Category mapping
const CATEGORY_MAP: Record<string, string> = {
  Restaurants: "13065", // Restaurants
  Hotels: "19014", // Hotels
  Gas: "19040", // Gas Stations
  Attractions: "16000", // Attractions
};

export default function ExploreNearby() {
  const [activeCategory, setActiveCategory] = useState("Restaurants");
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Example coordinates (you can replace with user’s GPS later)
  const latitude = 12.9716;
  const longitude = 77.5946;

  // Fetch places based on active category
  const fetchPlaces = async (category: string) => {
    try {
      setLoading(true);
      setPlaces([]);

      const url = `${API_CONFIG.FOURSQUARE.BASE_URL}/places/search?ll=${latitude},${longitude}&categories=${CATEGORY_MAP[category]}&limit=10`;

      const response = await fetch(url, {
        headers: getFoursquareHeaders(),
      });

      const data = await response.json();
      setPlaces(data.results || []);
    } catch (error) {
      console.error("Error fetching places:", error);
    } finally {
      setLoading(false);
    }
  };

  // Refetch when category changes
  useEffect(() => {
    fetchPlaces(activeCategory);
  }, [activeCategory]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Explore Nearby</Text>

      {/* Tabs */}
      <View style={styles.tabs}>
        {Object.keys(CATEGORY_MAP).map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.tab,
              activeCategory === category && styles.activeTab,
            ]}
            onPress={() => setActiveCategory(category)}
          >
            <Text
              style={[
                styles.tabText,
                activeCategory === category && styles.activeText,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Places list */}
      {loading ? (
        <ActivityIndicator size="large" color="blue" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.fsq_id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.placeName}>{item.name}</Text>
              <Text style={styles.placeAddress}>
                {item.location?.formatted_address || "No address available"}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.noData}>No results found</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#fff" },
  heading: { fontSize: 24, fontWeight: "bold", marginBottom: 15 },
  tabs: { flexDirection: "row", justifyContent: "space-around", marginBottom: 15 },
  tab: { padding: 10, borderRadius: 8, backgroundColor: "#eee" },
  activeTab: { backgroundColor: "#007BFF" },
  tabText: { color: "#000", fontWeight: "600" },
  activeText: { color: "#fff" },
  card: { padding: 15, borderBottomWidth: 1, borderBottomColor: "#ddd" },
  placeName: { fontSize: 18, fontWeight: "bold" },
  placeAddress: { color: "gray" },
  noData: { textAlign: "center", marginTop: 20, color: "#666" },
});
