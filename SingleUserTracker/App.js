// App.js
import axios from "axios";
import * as Location from "expo-location";
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

////////////////////////////////////////////////////////////////////////////////
// 🔑 KEYS — replace with your own tokens
////////////////////////////////////////////////////////////////////////////////
const MAPBOX_TOKEN = "pk.eyJ1Ijoic291bmRoYXJ5YSIsImEiOiJjbWU4MG0zZHcwNXJ5MmpxeGRxYW1sdWU4In0.R1lZA658526l1ZF2VxGG-w";        // e.g. pk.eyJ1Ijo...
const GEOAPIFY_KEY = "c82e492f814643bb995b2f02e110e591";        // e.g. abcdef123...

////////////////////////////////////////////////////////////////////////////////
// 🗂️ CATEGORY MAP — map human terms → Geoapify categories
////////////////////////////////////////////////////////////////////////////////
const CATEGORY_MAP = {
  // Healthcare
  hospital: "healthcare.hospital",
  hospitals: "healthcare.hospital",
  clinic: "healthcare.clinic",
  clinics: "healthcare.clinic",
  pharmacy: "healthcare.pharmacy",
  pharmacies: "healthcare.pharmacy",

  // Accommodation / food
  hotel: "accommodation.hotel",
  hotels: "accommodation.hotel",
  hostel: "accommodation.hostel",
  guesthouse: "accommodation.guest_house",
  restaurant: "catering.restaurant",
  restaurants: "catering.restaurant",
  food: "catering.restaurant",
  cafe: "catering.cafe",
  cafes: "catering.cafe",
  fastfood: "catering.fast_food",

  // Commerce
  supermarket: "commercial.supermarket",
  supermarkets: "commercial.supermarket",
  mall: "commercial.shopping_mall",
  shop: "commercial",
  shops: "commercial",
  bakery: "commercial.bakery",
  bank: "financial.bank",
  atm: "financial.atm",

  // Education
  school: "education.school",
  schools: "education.school",
  college: "education.college",
  colleges: "education.college",
  university: "education.university",
  universities: "education.university",
  library: "education.library",

  // Fuel / mobility
  fuel: "service.vehicle.fuel",
  petrol: "service.vehicle.fuel",
  "gas station": "service.vehicle.fuel",
  charging: "service.vehicle.charging_station",
  "charging station": "service.vehicle.charging_station",

  // Leisure / sport
  park: "leisure.park",
  playground: "leisure.playground",
  stadium: "sport.stadium",
  gym: "sport.gym",
  cinema: "entertainment.cinema",
  museum: "entertainment.museum",
  zoo: "entertainment.zoo",

  // Services & transport
  police: "service.police",
  fire: "service.fire_station",
  bus: "transport.bus",
  railway: "transport.rail",
  metro: "transport.metro",
  airport: "transport.airport",
};

////////////////////////////////////////////////////////////////////////////////
// 📄 Map HTML to load inside WebView (Mapbox GL JS)
////////////////////////////////////////////////////////////////////////////////
const MAP_HTML = (token) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Map</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"></script>
  <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet"/>
  <style>
    html, body { margin:0; padding:0; height:100%; }
    #map { width:100%; height:100%; }
    .mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib { display: none !important; } /* keep UI clean */
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    mapboxgl.accessToken = "${token}";
    window.map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v11",
      center: [0, 0],
      zoom: 2
    });

    // state kept in page
    window.userMarker = null;
    window.userPopup = null;
    window.searchMarkers = [];
    window.routeLayerId = "route-line";
    window.routeSourceId = "route-source";

    function post(msg){
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      }
    }

    // Messages from RN
    function handleMessage(data) {
      if (!data) return;

      if (data.type === "CENTER") {
        const lng = data.center[0], lat = data.center[1];
        try { window.map.flyTo({ center: [lng, lat], zoom: data.zoom || 14 }); } catch(e){}
        // Create / update user marker with popup (no duplicates)
        if (!window.userPopup) {
          window.userPopup = new mapboxgl.Popup({ closeOnClick: false }).setHTML("<b>You are here</b>");
        }
        if (!window.userMarker) {
          window.userMarker = new mapboxgl.Marker({ color: "blue" })
            .setLngLat([lng, lat])
            .setPopup(window.userPopup)
            .addTo(window.map);
          try { window.userMarker.togglePopup(); } catch(e){}
        } else {
          window.userMarker.setLngLat([lng, lat]);
        }
      }

      if (data.type === "USER_LOC") {
        const lng = data.center[0], lat = data.center[1];
        if (!window.userMarker) {
          window.userPopup = new mapboxgl.Popup({ closeOnClick: false }).setHTML("<b>You are here</b>");
          window.userMarker = new mapboxgl.Marker({ color: "blue" })
            .setLngLat([lng, lat]).setPopup(window.userPopup).addTo(window.map);
        } else {
          window.userMarker.setLngLat([lng, lat]);
        }
      }

      if (data.type === "PLACES") {
        // clear old markers
        if (window.searchMarkers && window.searchMarkers.length) {
          window.searchMarkers.forEach(m => m.remove());
        }
        window.searchMarkers = [];

        (data.places || []).forEach((place) => {
          const m = new mapboxgl.Marker({ color: "red" })
            .setLngLat([place.longitude, place.latitude])
            .setPopup(new mapboxgl.Popup().setHTML("<b>" + (place.name || "Place") + "</b><br/>" + (place.address || "")))
            .addTo(window.map);
          window.searchMarkers.push(m);

          // click marker → send PLACE_SELECTED back to RN
          m.getElement().addEventListener("click", () => {
            post({ type: "PLACE_SELECTED", place });
          });
        });

        if ((data.places || []).length > 0) {
          const bounds = new mapboxgl.LngLatBounds();
          data.places.forEach(p => bounds.extend([p.longitude, p.latitude]));
          try { window.map.fitBounds(bounds, { padding: 50 }); } catch(e){}
        }
      }

      if (data.type === "ROUTE") {
        try {
          if (window.map.getLayer(window.routeLayerId)) window.map.removeLayer(window.routeLayerId);
          if (window.map.getSource(window.routeSourceId)) window.map.removeSource(window.routeSourceId);
        } catch(e){}

        if (data.route) {
          window.map.addSource(window.routeSourceId, {
            type: "geojson",
            data: { type: "Feature", properties: {}, geometry: data.route }
          });
          window.map.addLayer({
            id: window.routeLayerId,
            type: "line",
            source: window.routeSourceId,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#007AFF", "line-width": 5 }
          });
          try { window.map.fitBounds([data.start, data.end], { padding: 50 }); } catch(e){}
        }
      }

      if (data.type === "CLEAR_ROUTE") {
        try {
          if (window.map.getLayer(window.routeLayerId)) window.map.removeLayer(window.routeLayerId);
          if (window.map.getSource(window.routeSourceId)) window.map.removeSource(window.routeSourceId);
        } catch(e){}
      }
    }

    // Platform differences: handle both
    document.addEventListener("message", (e) => { try { handleMessage(JSON.parse(e.data)); } catch(_){} });
    window.addEventListener("message", (e) => { try { handleMessage(typeof e.data === "string" ? JSON.parse(e.data) : e.data); } catch(_){} });

    // notify RN when ready
    window.map.on("load", () => post({ type: "MAP_READY" }));
  </script>
</body>
</html>
`;

export default function App() {
  // gate (name screen)
  const [name, setName] = useState("");
  const [entered, setEntered] = useState(false);

  // location & nav
  const [location, setLocation] = useState(null); // { latitude, longitude }
  const watchRef = useRef(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [routeSteps, setRouteSteps] = useState([]);
  const [voiceOn, setVoiceOn] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  // UI state
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const webRef = useRef(null);

  const postToMap = useCallback((msg) => {
    webRef.current?.postMessage(JSON.stringify(msg));
  }, []);

  ////////////////////////////////////////////////////////////////////////////
  // 👤 Enter app
  ////////////////////////////////////////////////////////////////////////////
  const enterApp = async () => {
    if (!name.trim()) {
      Alert.alert("Missing name", "Please enter your name to continue.");
      return;
    }
    setEntered(true);

    // ask location
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Location Required",
        "Please enable location permission in Settings and relaunch the app."
      );
      return;
    }

    const loc = await Location.getCurrentPositionAsync({});
    setLocation(loc.coords);

    // start watch
    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        distanceInterval: 5,
        timeInterval: 4000,
      },
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ latitude, longitude });
        // update user marker without duplicating
        postToMap({ type: "USER_LOC", center: [longitude, latitude] });

        // if we are navigating, recompute route live
        if (selectedPlace) {
          fetchRoute(latitude, longitude, selectedPlace.latitude, selectedPlace.longitude, false);
        }
      }
    );
    watchRef.current = sub;
  };

  useEffect(() => {
    return () => {
      if (watchRef.current?.remove) watchRef.current.remove();
    };
  }, []);

  ////////////////////////////////////////////////////////////////////////////
  // 🔎 Search — categories via Geoapify Places, else geocoding
  ////////////////////////////////////////////////////////////////////////////
  const kmToMeters = (km) => km * 1000;

  const askExpandRadius = (currentKm) =>
    new Promise((resolve) => {
      Alert.alert(
        "Not found nearby",
        `No results within ${currentKm} km. Expand search?`,
        [
          { text: "20 km", onPress: () => resolve(20) },
          { text: "50 km", onPress: () => resolve(50) },
          { text: "75 km", onPress: () => resolve(75) },
          { text: "Cancel", style: "cancel", onPress: () => resolve(null) },
        ],
        { cancelable: true }
      );
    });

  const distanceMeters = (a, b) => {
    const dx = (a.lon - b.lon) * 111320 * Math.cos(((a.lat + b.lat) / 2) * Math.PI / 180);
    const dy = (a.lat - b.lat) * 110540;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleSearch = async () => {
    if (!location) {
      Alert.alert("Location not ready", "Waiting for GPS fix...");
      return;
    }
    const text = (query || "").trim();
    if (!text) return;

    const lower = text.toLowerCase();
    const cat = CATEGORY_MAP[lower] || null;

    let radiusKm = 10;
    let results = [];

    while (true) {
      try {
        if (cat) {
          // Category search (Geoapify Places)
          const url =
            `https://api.geoapify.com/v2/places?` +
            `categories=${encodeURIComponent(cat)}` +
            `&filter=circle:${location.longitude},${location.latitude},${kmToMeters(radiusKm)}` +
            `&bias=proximity:${location.longitude},${location.latitude}` +
            `&limit=20&apiKey=${GEOAPIFY_KEY}`;
          const res = await axios.get(url);
          const feats = res?.data?.features || [];
          results = feats.map((f) => ({
            id: f.properties.place_id || f.properties.osm_id || String(Math.random()),
            name: f.properties.name || f.properties.address_line1 || lower,
            address: f.properties.formatted || "",
            latitude: f.geometry.coordinates[1],
            longitude: f.geometry.coordinates[0],
          }));
        } else {
          // Text geocoding (Geoapify Geocoder) + filter by radius around user
          const url =
            `https://api.geoapify.com/v1/geocode/search?` +
            `text=${encodeURIComponent(text)}` +
            `&bias=proximity:${location.longitude},${location.latitude}` +
            `&limit=20&apiKey=${GEOAPIFY_KEY}`;
          const res = await axios.get(url);
          const feats = res?.data?.features || [];
          results = feats
            .map((f) => ({
              id: f.properties.place_id || f.properties.osm_id || String(Math.random()),
              name: f.properties.name || f.properties.address_line1 || text,
              address: f.properties.formatted || "",
              latitude: f.geometry.coordinates[1],
              longitude: f.geometry.coordinates[0],
              _dist: distanceMeters(
                { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] },
                { lat: location.latitude, lon: location.longitude }
              ),
            }))
            .filter((p) => p._dist <= kmToMeters(radiusKm))
            .map(({ _dist, ...rest }) => rest);
        }

        if (results.length === 0) {
          const nextKm = await askExpandRadius(radiusKm);
          if (!nextKm) return; // user cancelled
          radiusKm = nextKm;
          continue;
        }

        // Show markers on map
        postToMap({ type: "PLACES", places: results });
        setSearchResults(results);
        break;
      } catch (err) {
        console.warn("Search error:", err?.message);
        Alert.alert("Search failed", err?.message || "Please try again.");
        break;
      }
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  // 🚗 Directions (Mapbox Directions)
  ////////////////////////////////////////////////////////////////////////////
  const fetchRoute = async (fromLat, fromLon, toLat, toLon, openPanelIfNew = true) => {
    try {
      const url =
        `https://api.mapbox.com/directions/v5/mapbox/driving/` +
        `${fromLon},${fromLat};${toLon},${toLat}` +
        `?steps=true&geometries=geojson&access_token=${MAPBOX_TOKEN}`;
      const res = await axios.get(url);
      const route = res?.data?.routes?.[0];
      if (!route) {
        Alert.alert("No route", "Could not find a route.");
        return;
      }

      // draw route
      postToMap({
        type: "ROUTE",
        route: route.geometry,
        start: [fromLon, fromLat],
        end: [toLon, toLat],
      });

      // steps for panel
      const steps = (route.legs?.[0]?.steps || []).map((s) => s.maneuver.instruction);
      setRouteSteps(steps);

      if (openPanelIfNew) {
        setPanelOpen(true);
        if (voiceOn && steps.length > 0) {
          Speech.speak("Navigation started. Follow the instructions.");
          Speech.speak(steps[0]);
        }
      }
    } catch (err) {
      console.warn("Route error:", err?.message);
      Alert.alert("Route error", err?.message || "Please try again.");
    }
  };

  const startNavigationTo = (place) => {
    if (!location) {
      Alert.alert("Location not ready", "Waiting for GPS fix...");
      return;
    }
    setSelectedPlace(place);
    fetchRoute(location.latitude, location.longitude, place.latitude, place.longitude, true);
  };

  const clearRoute = () => {
    setSelectedPlace(null);
    setRouteSteps([]);
    setPanelOpen(false);
    postToMap({ type: "CLEAR_ROUTE" });
  };

  ////////////////////////////////////////////////////////////////////////////
  // 🗺️ Map callbacks
  ////////////////////////////////////////////////////////////////////////////
  const onWebMessage = (event) => {
    try {
      const data = JSON.parse(event?.nativeEvent?.data || "{}");
      if (data?.type === "MAP_READY" && location) {
        postToMap({
          type: "CENTER",
          center: [location.longitude, location.latitude],
          zoom: 15,
        });
      }
      if (data?.type === "PLACE_SELECTED") {
        const p = data.place;
        startNavigationTo(p);
      }
    } catch {}
  };

  ////////////////////////////////////////////////////////////////////////////
  // 🖥️ UI
  ////////////////////////////////////////////////////////////////////////////
  if (!entered) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>Single User Tracker</Text>
        <TextInput
          style={styles.input}
          placeholder="Your name"
          value={name}
          onChangeText={setName}
        />
        <Button title="Enter" onPress={enterApp} />
        <Text style={styles.hint}>
          Make sure Location is ON. We’ll center the map to you and show a “You are here” popup.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search (e.g., hospital, hotel, school, college, fuel...)"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html: MAP_HTML(MAPBOX_TOKEN) }}
        style={{ flex: 1 }}
        onMessage={onWebMessage}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        mixedContentMode="always"
      />

      {/* Results list (tap → start navigation) */}
      {searchResults.length > 0 && (
        <ScrollView style={styles.results}>
          {searchResults.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.resultItem}
              onPress={() => startNavigationTo(p)}
            >
              <Text style={styles.resultName}>{p.name || p.address || "Place"}</Text>
              {!!p.address && <Text style={styles.resultAddr}>{p.address}</Text>}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Floating recenter button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: panelOpen ? 180 : 100 }]}
        onPress={() => {
          if (location) {
            postToMap({ type: "CENTER", center: [location.longitude, location.latitude], zoom: 15 });
          }
        }}
      >
        <Text style={styles.fabTxt}>◎</Text>
      </TouchableOpacity>

      {/* Floating speak/reopen button */}
      <TouchableOpacity
        style={[styles.fab, { right: 20 + 56, bottom: panelOpen ? 180 : 100 }]}
        onPress={() => {
          if (!routeSteps.length) return;
          setPanelOpen(true);
          if (voiceOn) Speech.speak(routeSteps[0]);
        }}
      >
        <Text style={styles.fabTxt}>➤</Text>
      </TouchableOpacity>

      {/* Directions panel */}
      {panelOpen && (
        <View style={styles.panel}>
          <TouchableOpacity style={styles.close} onPress={clearRoute}>
            <Text style={styles.closeTxt}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.panelTitle}>Directions</Text>
          <View style={styles.voiceRow}>
            <Text style={{ marginRight: 8 }}>Voice</Text>
            <Switch value={voiceOn} onValueChange={setVoiceOn} />
          </View>

          <ScrollView style={{ maxHeight: 160, marginTop: 10 }}>
            {routeSteps.map((s, idx) => (
              <Text key={idx} style={styles.step}>
                ➜ {s}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

////////////////////////////////////////////////////////////////////////////////
// 🎨 Styles
////////////////////////////////////////////////////////////////////////////////
const styles = StyleSheet.create({
  // Gate
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  hint: { marginTop: 8, fontSize: 12, color: "#666", textAlign: "center" },

  // Main
  container: { flex: 1, backgroundColor: "#fff" },

  searchRow: {
    flexDirection: "row",
    padding: 10,
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5e5",
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    marginRight: 8,
  },
  searchBtn: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  searchBtnText: { color: "#fff", fontWeight: "600" },

  results: {
    maxHeight: 140,
    backgroundColor: "#fafafa",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#eee",
  },
  resultItem: {
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  resultName: { fontWeight: "600" },
  resultAddr: { color: "#666", marginTop: 2 },

  fab: {
    position: "absolute",
    right: 20,
    backgroundColor: "#111827",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  fabTxt: { color: "#fff", fontSize: 18, fontWeight: "700" },

  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e5e5",
  },
  close: { position: "absolute", right: 8, top: 6, padding: 4 },
  closeTxt: { fontSize: 18, fontWeight: "700" },
  panelTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  voiceRow: { flexDirection: "row", alignItems: "center" },
  step: { marginBottom: 6 },
});
