import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Button, Switch, StyleSheet, SafeAreaView, Alert } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import axios from "axios";
import { db } from "../../firebaseconfig";
import { ref as dbRef, set as dbSet, onValue, remove as dbRemove } from "firebase/database";

// ---------- CONFIG ----------
const MAPBOX_TOKEN = "pk.eyJ1Ijoic291bmRoYXJ5YSIsImEiOiJjbWU4MG0zZHcwNXJ5MmpxeGRxYW1sdWU4In0.R1lZA658526l1ZF2VxGG-w";
const FOURSQUARE_API_KEY = "fsq3nAU59Qxza3RgOnYfbmGxnxutifJUN7jYxRDIG968erQ="; // Replace with yours
// ----------------------------

// Helper: sanitize Firebase keys
function sanitizeKey(key: string): string {
  return key.replace(/[.#$[\]@]/g, "_");
}

interface User {
  uid: string;
  name: string;
  latitude: number;
  longitude: number;
  ts: number;
}

interface Place {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
}

export default function MapScreen() {
  const [groupId, setGroupId] = useState("team@example.com");
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const webviewRef = useRef<WebView>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const usersListenerRef = useRef<(() => void) | null>(null);

  // HTML for Mapbox map
  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://api.mapbox.com/mapbox-gl-js/v2.13.0/mapbox-gl.js"></script>
        <link href="https://api.mapbox.com/mapbox-gl-js/v2.13.0/mapbox-gl.css" rel="stylesheet" />
        <style>
          body, html { margin: 0; padding: 0; height: 100%; }
          #map { width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          mapboxgl.accessToken = '${MAPBOX_TOKEN}';
          const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [0, 0],
            zoom: 2
          });

          const markers: Record<string, any> = {};
          const placesMarkers: Record<string, any> = {};

          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));

          document.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'CENTER') {
              map.flyTo({ center: data.center, zoom: data.zoom });
            }
            if (data.type === 'USERS') {
              for (const uid in markers) {
                markers[uid].remove();
              }
              for (const user of data.users) {
                if (user.latitude && user.longitude) {
                  const marker = new mapboxgl.Marker({ color: 'blue' })
                    .setLngLat([user.longitude, user.latitude])
                    .setPopup(new mapboxgl.Popup().setText(user.name))
                    .addTo(map);
                  markers[user.uid] = marker;
                }
              }
            }
            if (data.type === 'PLACES') {
              for (const pid in placesMarkers) {
                placesMarkers[pid].remove();
              }
              for (const place of data.places) {
                if (place.latitude && place.longitude) {
                  const marker = new mapboxgl.Marker({ color: 'red' })
                    .setLngLat([place.longitude, place.latitude])
                    .setPopup(new mapboxgl.Popup().setText(place.name))
                    .addTo(map);
                  placesMarkers[place.id] = marker;
                }
              }
            }
          });
        </script>
      </body>
    </html>
  `;

  // Join a group
  const joinGroup = () => {
    if (!groupId || !name) {
      Alert.alert("Enter group ID (email) and name");
      return;
    }
    const generatedUid = `${name.replace(/\s+/g, "_")}_${Date.now()}`;
    setUid(generatedUid);
    setJoined(true);
  };

  // Start location watcher
  const startWatcher = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Location permission required");
      return;
    }
    const subscription = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Highest, distanceInterval: 8, timeInterval: 3000 },
      (pos) => {
        if (!(joined && isSharing && uid)) return;
        const { latitude, longitude } = pos.coords;
        const safeGroupId = sanitizeKey(groupId);
        const userRef = dbRef(db, `groups/${safeGroupId}/users/${uid}`);
        dbSet(userRef, { name, latitude, longitude, ts: Date.now() })
          .catch(err => console.warn("firebase write err", err));
        sendToWebview({ type: "CENTER", center: [longitude, latitude], zoom: 13 });
        fetchPlaces(latitude, longitude);
      }
    );
    watchRef.current = subscription;
  };

  // Stop location watcher
  const stopWatcher = () => {
    if (watchRef.current) {
      try {
        // Check if the subscription has a remove method
        if (typeof watchRef.current.remove === 'function') {
          watchRef.current.remove();
        }
      } catch (error) {
        console.warn('Error removing location subscription:', error);
      }
      watchRef.current = null;
    }
  };

  // Handle sharing toggle
  useEffect(() => {
    if (joined && isSharing) {
      startWatcher();
    } else {
      stopWatcher();
      if (uid) {
        const safeGroupId = sanitizeKey(groupId);
        const userRef = dbRef(db, `groups/${safeGroupId}/users/${uid}`);
        dbRemove(userRef).catch(() => {});
      }
    }
  }, [isSharing]);

  // Listen to group users
  useEffect(() => {
    if (!joined) return;
    const safeGroupId = sanitizeKey(groupId);
    const usersDbRef = dbRef(db, `groups/${safeGroupId}/users`);
    const unsubscribe = onValue(usersDbRef, (snapshot) => {
      const val = snapshot.val() || {};
      const arr = Object.keys(val).map(k => ({ uid: k, ...val[k] }));
      setUsers(arr);
      sendToWebview({ type: "USERS", users });
    });
    usersListenerRef.current = unsubscribe;
  }, [joined]);

  // Leave group
  const leaveGroup = () => {
    stopWatcher();
    if (uid) {
      const safeGroupId = sanitizeKey(groupId);
      const userRef = dbRef(db, `groups/${safeGroupId}/users/${uid}`);
      dbRemove(userRef).catch(() => {});
    }
    if (usersListenerRef.current) {
      usersListenerRef.current();
      usersListenerRef.current = null;
    }
    setUsers([]);
    setJoined(false);
    setUid(null);
  };

  // Fetch nearby places from updated Foursquare API
  const fetchPlaces = async (latitude: number, longitude: number) => {
    if (!FOURSQUARE_API_KEY) return;
    try {
      const res = await axios.get("https://api.foursquare.com/v3/places/nearby", {
        headers: {
          Authorization: FOURSQUARE_API_KEY,
          Accept: "application/json"
        },
        params: {
          ll: `${latitude},${longitude}`,
          radius: 2000,
          limit: 12
        }
      });
      const items: Place[] = (res.data.results || []).map((p: any) => ({
        id: p.fsq_id,
        name: p.name,
        latitude: p.geocodes?.main?.latitude,
        longitude: p.geocodes?.main?.longitude,
        category: p.categories?.[0]?.name || ""
      }));
      sendToWebview({ type: "PLACES", places: items });
    } catch (err: any) {
      console.warn("foursquare err", err?.response?.data || err.message);
    }
  };

  const sendToWebview = (obj: any) => {
    webviewRef.current?.postMessage(JSON.stringify(obj));
  };

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
          <Button title="Join Group" onPress={joinGroup} />
          <Text style={{ marginTop: 12, color: "#444" }}>
            Tip: use the same Group ID for your teammates
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Group: {groupId}</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ marginRight: 8 }}>
                {isSharing ? "Sharing" : "Hidden"}
              </Text>
              <Switch value={isSharing} onValueChange={setIsSharing} />
            </View>
            <Button title="Leave" onPress={leaveGroup} />
          </View>
          <WebView
            ref={webviewRef}
            originWhitelist={["*"]}
            source={{ html: mapHtml }}
            style={{ flex: 1 }}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data?.type === "MAP_READY") {
                  sendToWebview({ type: "USERS", users });
                }
              } catch (err) {}
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  joinContainer: { 
    padding: 20, 
    alignItems: "stretch", 
    justifyContent: "center", 
    flex: 1 
  },
  input: { 
    borderWidth: 1, 
    borderColor: "#ccc", 
    padding: 10, 
    marginVertical: 8, 
    borderRadius: 6 
  },
  h1: { 
    fontSize: 20, 
    marginBottom: 12 
  },
  header: { 
    height: 56, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingHorizontal: 12, 
    borderBottomWidth: 1, 
    borderColor: "#eee" 
  },
  headerText: { 
    fontWeight: "600" 
  }
});