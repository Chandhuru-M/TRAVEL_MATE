// src/components/GroupMapView.tsx
// @ts-nocheck
// This is your friend's code, adapted to be a component.

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Switch,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import * as Speech from "expo-speech";
import axios from "axios";
// --- THIS IS THE FINAL AND DEFINITIVE FIX ---
// 1. Import the core Firebase libraries directly
import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase, ref as dbRef, set as dbSet, onValue, remove as dbRemove } from "firebase/database";

// 2. Define the config and initialize Firebase INSIDE this component
const firebaseConfig = {
  apiKey: "AIzaSyBgz7wpg1nkXZ9uuHyCgLRwAfZ_FzFAlJA",
  authDomain: "travelmate-07chss.firebaseapp.com",
  databaseURL: "https://travelmate-07chss-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "travelmate-07chss",
  storageBucket: "travelmate-07chss.firebasestorage.app",
  messagingSenderId: "985002644614",
  appId: "1:985002644614:web:bba90799c119c92ef76d07"
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}
const db = getDatabase(app);
// --- END OF FIX ---

const MAPBOX_TOKEN = "pk.eyJ1Ijoic291bmRoYXJ5YSIsImEiOiJjbWU4MG0zZHcwNXJ5MmpxeGRxYW1sdWU4In0.R1lZA658526l1ZF2VxGG-w";
const GEOAPIFY_KEY = "c82e492f814643bb995b2f02e110e591";

function sanitizeKey(key) {
  return key.replace(/[.#$[@]/g, "_");
}

const categoryMap = {
  hospital: "healthcare.hospital",
  clinic: "healthcare.clinic",
  pharmacy: "healthcare.pharmacy",
  hotel: "accommodation.hotel",
  hostel: "accommodation.hostel",
  guesthouse: "accommodation.guest_house",
  restaurant: "catering.restaurant",
  food: "catering.restaurant",
  cafe: "catering.cafe",
  fastfood: "catering.fast_food",
  supermarket: "commercial.supermarket",
  shop: "commercial",
  mall: "commercial.shopping_mall",
  school: "education.school",
  college: "education.college",
  university: "education.university",
  library: "education.library",
  petrol: "service.vehicle.fuel",
  "gas station": "service.vehicle.fuel",
  fuel: "service.vehicle.fuel",
  charging: "service.vehicle.charging_station",
  park: "leisure.park",
  playground: "leisure.playground",
  stadium: "sport.stadium",
  gym: "sport.gym",
  police: "service.police",
  fire: "service.fire_station",
  bus: "transport.bus",
  railway: "transport.rail",
  airport: "transport.airport",
};

export default function GroupMapView({ onLeave }: { onLeave: () => void }) {
  const [groupId, setGroupId] = useState("team@example.com");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [joined, setJoined] = useState(false);
  const [uid, setUid] = useState(null);
  const [isSharing, setIsSharing] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [routeSteps, setRouteSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [distanceLeft, setDistanceLeft] = useState(null);
  const [showInstruction, setShowInstruction] = useState(false);

  const webviewRef = useRef(null);
  const watchRef = useRef(null);
  const usersListenerRef = useRef(null);

  const mapHtml = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="https://api.mapbox.com/mapbox-gl-js/v2.13.0/mapbox-gl.js"></script>
<link href="https://api.mapbox.com/mapbox-gl-js/v2.13.0/mapbox-gl.css" rel="stylesheet" />
<style>body, html { margin: 0; padding: 0; height: 100%; } #map { width: 100%; height: 100%; }</style>
</head>
<body>
<div id="map"></div>
<script>
mapboxgl.accessToken = '${MAPBOX_TOKEN}';
const map = new mapboxgl.Map({ container: 'map', style: 'mapbox://styles/mapbox/streets-v11', center: [0,0], zoom: 2 });
const markers = {};
const placesMarkers = {};
let startMarker = null, endMarker = null;
window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));

document.addEventListener('message', (event) => {
  try {
    const data = JSON.parse(event.data);
    if (!data) return;

    if(data.type==='CENTER'){
      map.flyTo({center:data.center, zoom:data.zoom});
      new mapboxgl.Marker({color:'green'})
        .setLngLat(data.center)
        .setPopup(new mapboxgl.Popup().setText("You are here"))
        .addTo(map);
    }

    if(data.type==='USERS'){
      for(const uid in markers){ markers[uid].remove(); }
      for(const user of data.users){
        if(user.latitude && user.longitude){
          const marker=new mapboxgl.Marker({color:'blue'})
            .setLngLat([user.longitude,user.latitude])
            .setPopup(new mapboxgl.Popup().setText(user.name))
            .addTo(map);
          markers[user.uid]=marker;
        }
      }
    }

    if(data.type==='PLACES'){
      for(const pid in placesMarkers){ placesMarkers[pid].remove(); }
      for(const place of data.places){
        if(place.latitude && place.longitude){
          const marker=new mapboxgl.Marker({color:'red'})
            .setLngLat([place.longitude,place.latitude])
            .setPopup(new mapboxgl.Popup().setText(place.name + " — " + (place.address||"")))
            .addTo(map);
          placesMarkers[place.id]=marker;
          marker.getElement().addEventListener("click", () => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: "PLACE_SELECTED",
              place: { latitude: place.latitude, longitude: place.longitude }
            }));
          });
        }
      }
      if(data.places.length > 0){
        const bounds = new mapboxgl.LngLatBounds();
        data.places.forEach(p => bounds.extend([p.longitude, p.latitude]));
        map.fitBounds(bounds,{padding:50});
      }
    }

    if(data.type==='ROUTE'){
      if(map.getSource('route')) {
        map.removeLayer('route');
        map.removeSource('route');
      }
      if(startMarker){ startMarker.remove(); }
      if(endMarker){ endMarker.remove(); }

      if(data.route){
        map.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', geometry: data.route }
        });
        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#007AFF', 'line-width': 4 }
        });
        if(data.start){ startMarker = new mapboxgl.Marker({color:'green'}).setLngLat(data.start).addTo(map); }
        if(data.end){ endMarker = new mapboxgl.Marker({color:'red'}).setLngLat(data.end).addTo(map); }
        map.fitBounds([data.start, data.end], {padding:50});
      }
    }
  } catch(e){ console.error("Map message error", e); }
});
</script>
</body></html>`;

  const joinGroup = async () => {
    if (!groupId || !name || !phone) {
      Alert.alert("Enter group ID, name, and phone number");
      return;
    }
    const generatedUid = phone;
    setUid(generatedUid);
    setJoined(true);

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert('Location services are turned off. Please enable Location/GPS or set a simulated location in the emulator.');
        return;
      }
      let loc;
      try {
        loc = await Location.getCurrentPositionAsync({});
      } catch (err) {
        console.warn('Unable to get current position:', err.message || err);
        Alert.alert('Current location is unavailable. Make sure location services are enabled.');
        return;
      }
      setCurrentLocation(loc.coords);

      const safeGroupId = sanitizeKey(groupId);
      const userRef = dbRef(db, `groups/${safeGroupId}/users/${generatedUid}`);
      await dbSet(userRef, {
        uid: generatedUid,
        name,
        phone,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        ts: Date.now(),
      });

      sendToWebview({
        type: "CENTER",
        center: [loc.coords.longitude, loc.coords.latitude],
        zoom: 14,
      });
    }
  };

  const startWatcher = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Location permission required");
      return;
    }
    const subscription = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Highest, distanceInterval: 5, timeInterval: 5000 },
      (pos) => {
        if (!(joined && isSharing && uid)) return;
        const { latitude, longitude } = pos.coords;
        setCurrentLocation({ latitude, longitude });

        const safeGroupId = sanitizeKey(groupId);
        const userRef = dbRef(db, `groups/${safeGroupId}/users/${uid}`);
        dbSet(userRef, { uid, name, phone, latitude, longitude, ts: Date.now() });

        sendToWebview({ type: "CENTER", center: [longitude, latitude], zoom: 14 });

        if (selectedPlace) {
          fetchRoute(latitude, longitude, selectedPlace.latitude, selectedPlace.longitude);
        }
      }
    );
    watchRef.current = subscription;
  };

  const stopWatcher = () => {
    if (watchRef.current?.remove) {
      watchRef.current.remove();
      watchRef.current = null;
    }
  };

  useEffect(() => {
    if (joined && isSharing) startWatcher();
    else {
      stopWatcher();
      if (uid) {
        dbRemove(dbRef(db, `groups/${sanitizeKey(groupId)}/users/${uid}`));
      }
    }
  }, [isSharing, joined, uid, name, phone, groupId]);

  useEffect(() => {
    if (!joined) return;
    const safeGroupId = sanitizeKey(groupId);
    const usersDbRef = dbRef(db, `groups/${safeGroupId}/users`);
    const unsubscribe = onValue(usersDbRef, (snapshot) => {
      const val = snapshot.val() || {};
      const arr = Object.keys(val).map((k) => ({ uid: k, ...val[k] }));
      setUsers(arr);
      sendToWebview({ type: "USERS", users: arr });
    });
    usersListenerRef.current = unsubscribe;
    return () => {
      if (usersListenerRef.current) {
        usersListenerRef.current();
      }
    };
  }, [joined, groupId]);

  const leaveGroup = () => {
    stopWatcher();
    if (uid) dbRemove(dbRef(db, `groups/${sanitizeKey(groupId)}/users/${uid}`));
    if (usersListenerRef.current) {
      usersListenerRef.current();
      usersListenerRef.current = null;
    }
    setUsers([]);
    setJoined(false);
    setUid(null);
    setSelectedPlace(null);
    setShowInstruction(false);
    setRouteSteps([]);
    sendToWebview({ type: "ROUTE", route: null });
    
    if (onLeave) {
      onLeave();
    }
  };

  const fetchPlaces = async (lat, lon, query) => {
    if (!query) return;
    const q = query.trim().toLowerCase();
    const category = categoryMap[q];

    try {
      let url;
      if (category) {
        url = `https://api.geoapify.com/v2/places?categories=${encodeURIComponent(category)}&filter=circle:${lon},${lat},10000&limit=10&apiKey=${GEOAPIFY_KEY}`;
      } else {
        url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(query)}&bias=proximity:${lon},${lat}&limit=10&apiKey=${GEOAPIFY_KEY}`;
      }

      const res = await axios.get(url);
      const features = res.data?.features || [];
      const items = features.map((p) => ({
        id: p.properties.place_id || p.properties.osm_id || Math.random().toString(),
        name: p.properties.name || p.properties.address_line1 || query,
        address: p.properties.formatted || "",
        latitude: p.geometry.coordinates[1],
        longitude: p.geometry.coordinates[0],
      }));

      sendToWebview({ type: "PLACES", places: items });
    } catch (err) {
      console.warn("Geoapify search error:", err.message);
    }
  };

  const fetchRoute = async (fromLat, fromLon, toLat, toLon) => {
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${fromLon},${fromLat};${toLon},${toLat}?steps=true&geometries=geojson&access_token=${MAPBOX_TOKEN}`;
      const res = await axios.get(url);
      const route = res.data.routes[0].geometry;
      const steps = res.data.routes[0].legs[0].steps;

      setRouteSteps(steps);
      setCurrentStepIndex(0);

      const totalDistance = res.data.routes[0].distance / 1000;
      setDistanceLeft(totalDistance);

      sendToWebview({ 
        type: "ROUTE", 
        route, 
        start: [fromLon, fromLat], 
        end: [toLon, toLat] 
      });
    } catch (err) {
      console.warn("Route error:", err.message);
    }
  };

  useEffect(() => {
    if (routeSteps.length === 0 || !currentLocation) return;

    const step = routeSteps[currentStepIndex];
    if (!step) return;

    const dx = step.maneuver.location[0] - currentLocation.longitude;
    const dy = step.maneuver.location[1] - currentLocation.latitude;
    const dist = Math.sqrt(dx * dx + dy * dy) * 111;
    setDistanceLeft(dist);

    if (dist < 0.05 && currentStepIndex < routeSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      const nextInstruction = routeSteps[currentStepIndex + 1].maneuver.instruction;
      if (voiceEnabled) Speech.speak(nextInstruction);
    }
  }, [currentLocation, routeSteps, currentStepIndex, voiceEnabled]);

  const sendToWebview = (obj) => {
    webviewRef.current?.postMessage(JSON.stringify(obj));
  };

  const currentInstruction =
    routeSteps[currentStepIndex]?.maneuver?.instruction || "No active route";

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {!joined ? (
        <View style={styles.joinContainer}>
          <Text style={styles.h1}>Join a Group</Text>
          <TextInput
            placeholder="Group ID (email)"
            value={groupId}
            onChangeText={setGroupId}
            style={styles.input}
          />
          <TextInput
            placeholder="Your display name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          <TextInput
            placeholder="Phone number"
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
          />
          <Button title="Join Group" onPress={joinGroup} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Group: {groupId}</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ marginRight: 8 }}>{isSharing ? "Sharing" : "Hidden"}</Text>
              <Switch value={isSharing} onValueChange={setIsSharing} />
            </View>
            <Button title="Leave" onPress={leaveGroup} />
          </View>

          <View style={styles.searchBox}>
            <TextInput
              placeholder="Search (hospital, hotel, etc)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            <Button
              title="Go"
              onPress={() => {
                if (currentLocation)
                  fetchPlaces(
                    currentLocation.latitude,
                    currentLocation.longitude,
                    searchQuery
                  );
              }}
            />
          </View>

          <WebView
            ref={webviewRef}
            originWhitelist={["*"]}
            source={{ html: mapHtml }}
            style={{ flex: 1 }}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data?.type === "MAP_READY") sendToWebview({ type: "USERS", users });
                if (data?.type === "PLACE_SELECTED" && currentLocation) {
                  setSelectedPlace(data.place);
                  fetchRoute(
                    currentLocation.latitude,
                    currentLocation.longitude,
                    data.place.latitude,
                    data.place.longitude
                  );
                  setShowInstruction(true);
                }
              } catch {}
            }}
          />

          <TouchableOpacity
            style={styles.fab}
            onPress={() => {
              if (!selectedPlace) {
                Alert.alert("Pick a place first");
                return;
              }
              setShowInstruction(true);
              Alert.alert(
                "Start Navigation?",
                "Do you want directions to this place?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Yes",
                    onPress: () => {
                      if (voiceEnabled && currentInstruction) {
                        Speech.speak(currentInstruction);
                      }
                    },
                  },
                ]
              );
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 20 }}>➤</Text>
          </TouchableOpacity>

          {showInstruction && (
            <View style={styles.instructionBox}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowInstruction(false)}
              >
                <Text style={{ fontSize: 18, fontWeight: "bold" }}>✖</Text>
              </TouchableOpacity>

              <Text style={{ fontSize: 16, fontWeight: "600", marginTop: 4 }}>
                {currentInstruction}
              </Text>

              {distanceLeft && (
                <Text style={{ marginTop: 4, fontSize: 14, color: "gray" }}>
                  Distance left: {distanceLeft.toFixed(2)} km
                </Text>
              )}

              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                <Text>Voice</Text>
                <Switch value={voiceEnabled} onValueChange={setVoiceEnabled} />
              </View>

              <Text style={{ marginTop: 10, fontWeight: "600" }}>Steps:</Text>
              <ScrollView style={{ maxHeight: 120 }}>
                {routeSteps.map((s, idx) => (
                  <Text
                    key={idx}
                    style={{
                      color: idx === currentStepIndex ? "blue" : "black",
                      fontWeight: idx === currentStepIndex ? "bold" : "normal",
                      marginVertical: 2,
                    }}
                  >
                    {s.maneuver.instruction}
                  </Text>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  joinContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  h1: { fontSize: 20, marginBottom: 20, fontWeight: "bold" },
  input: { borderWidth: 1, borderColor: "#ccc", width: "100%", marginBottom: 10, padding: 8, borderRadius: 5 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10, backgroundColor: "#eee" },
  headerText: { fontSize: 14, fontWeight: "bold" },
  searchBox: { flexDirection: "row", padding: 10, backgroundColor: "#f9f9f9", alignItems: "center" },
  searchInput: { borderWidth: 1, borderColor: "#ccc", flex: 1, marginRight: 10, padding: 8, borderRadius: 5 },
  fab: { position: "absolute", bottom: 80, right: 20, backgroundColor: "#007AFF", padding: 14, borderRadius: 50, justifyContent: "center", alignItems: "center", elevation: 5 },
  instructionBox: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "white", padding: 12, borderTopLeftRadius: 12, borderTopRightRadius: 12, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 5 },
  closeBtn: { position: "absolute", top: 4, right: 8 },
});

