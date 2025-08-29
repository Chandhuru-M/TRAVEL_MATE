import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { getRouteORS, summarizeForSpeech, type RouteSummary } from '@/services/directions';
import { colors } from '@/constants/Colors';
// Avoid importing WebView on native to prevent RNCWebView missing module in Expo Go
const WebView: any = Platform.OS === 'web' ? require('react-native-webview').WebView : null;

export default function Directions() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const destLat = Number(params.lat);
  const destLng = Number(params.lng);
  const destName = (params.name as string) || 'Destination';
  const userLat = params.ulat ? Number(params.ulat) : undefined;
  const userLng = params.ulng ? Number(params.ulng) : undefined;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<RouteSummary | null>(null);
  const [spoken, setSpoken] = useState(false);
  // Store the selected place's location for use in Google Directions
  // This ensures we always have the correct lat/lng for the destination
  const [placeLocation, setPlaceLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (userLat == null || userLng == null || Number.isNaN(userLat) || Number.isNaN(userLng)) {
        setError('Missing your current location.');
        setLoading(false);
        return;
      }
      try {
  const s = await getRouteORS({ lat: userLat, lng: userLng }, { lat: destLat, lng: destLng });
        if (!cancelled) {
          setSummary(s);
          setLoading(false);
          const speech = summarizeForSpeech(s);
          Speech.speak(speech, { rate: 0.98, onDone: () => setSpoken(true), onError: () => setSpoken(true) });
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Failed to get directions');
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      Speech.stop();
    };
  }, [userLat, userLng, destLat, destLng]);

  useEffect(() => {
    // Set place location on mount, only if valid numbers
    if (
      typeof destLat === 'number' &&
      typeof destLng === 'number' &&
      !Number.isNaN(destLat) &&
      !Number.isNaN(destLng)
    ) {
      setPlaceLocation({ lat: destLat, lng: destLng });
    } else {
      setPlaceLocation(null);
    }
  }, [destLat, destLng]);

  const openInMaps = () => {
    // Use stored placeLocation for destination, fallback to default if not set
    const dest =
      placeLocation && typeof placeLocation.lat === 'number' && typeof placeLocation.lng === 'number'
        ? encodeURIComponent(`${placeLocation.lat},${placeLocation.lng}`)
        : encodeURIComponent(`${destLat},${destLng}`);
    let url = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
    if (
      typeof userLat === 'number' &&
      typeof userLng === 'number' &&
      !Number.isNaN(userLat) &&
      !Number.isNaN(userLng)
    ) {
      const origin = encodeURIComponent(`${userLat},${userLng}`);
      url += `&origin=${origin}`;
    }
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.light }]}> 
      <View style={[styles.fallback, { backgroundColor: colors.card.light, borderRadius: 16, margin: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }]}> 
        <Text style={[styles.fallbackTitle, { color: colors.text.light }]}>Directions</Text>
        {loading && (
          <View style={{ alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary.light} />
            <Text style={[styles.fallbackText, { color: colors.textMuted.light }]}>Fetching route…</Text>
          </View>
        )}
        {!loading && error && (
          <Text style={[styles.fallbackText, { color: '#ef4444' }]}> {error} </Text>
        )}
        {!loading && !error && summary && (
          <>
            {Platform.OS === 'web' && process.env.EXPO_PUBLIC_MAPBOX_TOKEN && summary.geometry && WebView ? (
              <View style={{ height: 220, width: '100%', borderRadius: 12, overflow: 'hidden', marginBottom: 8, borderWidth: 1, borderColor: colors.border.light }}>
                <WebView
                  style={{ flex: 1 }}
                  originWhitelist={["*"]}
                  source={{ html: buildMapHtml(process.env.EXPO_PUBLIC_MAPBOX_TOKEN as string, userLat!, userLng!, destLat, destLng, summary.geometry) }}
                />
              </View>
            ) : null}
            <ScrollView style={{ maxHeight: 260 }} contentContainerStyle={{ paddingVertical: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 6, color: colors.text.light }}>Route Summary</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted.light, marginBottom: 8 }}>
                Distance: {(summary.distance_m/1000).toFixed(1)} km • Time: {Math.round(summary.duration_s/60)} min
              </Text>
              {summary.steps.slice(0, 10).map((s, i) => (
                <Text key={i} style={{ fontSize: 13, color: colors.text.light, marginBottom: 4 }}>{i+1}. {s.instruction}</Text>
              ))}
            </ScrollView>
          </>
        )}
      </View>
      <View style={[styles.footer, { backgroundColor: colors.card.light, borderTopColor: colors.border.light }]}> 
        <Text style={[styles.title, { color: colors.text.light }]}>Directions to {destName}</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.button, { backgroundColor: colors.border.light }]}> 
            <Text style={[styles.buttonText, { color: colors.text.light }]}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push({ pathname: '/live-navigation' as any, params: { lat: destLat, lng: destLng, name: destName, profile: 'walking' } })} style={[styles.button, { backgroundColor: '#10b981' }]}> 
            <Text style={[styles.buttonText, { color: 'white' }]}>Start Live Nav</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openInMaps} style={[styles.button, { backgroundColor: colors.primary.light, flexDirection: 'row', alignItems: 'center' }]}> 
            <Text style={[styles.buttonText, { color: 'white' }]}>Open in Google Maps</Text>
            {summary && (
              <Text style={{ color: 'white', marginLeft: 8, fontSize: 13 }}>
                { (summary.distance_m/1000).toFixed(1) } km
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function buildMapHtml(token: string, userLat: number, userLng: number, destLat: number, destLng: number, geometry: { type: 'LineString'; coordinates: number[][] }) {
  const route = JSON.stringify({ type: 'Feature', geometry })
  return `<!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://api.mapbox.com/mapbox-gl-js/v2.13.0/mapbox-gl.js"></script>
    <link href="https://api.mapbox.com/mapbox-gl-js/v2.13.0/mapbox-gl.css" rel="stylesheet" />
    <style>html,body{margin:0;height:100%}#map{height:100%;width:100%}</style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      mapboxgl.accessToken = '${token}';
      const map = new mapboxgl.Map({ container: 'map', style: 'mapbox://styles/mapbox/streets-v11', center: [${userLng}, ${userLat}], zoom: 13 });
      const route = ${route};
      map.on('load', () => {
        map.addSource('route', { type: 'geojson', data: route });
        map.addLayer({ id: 'route', type: 'line', source: 'route', paint: { 'line-color': '#1D4ED8', 'line-width': 4 } });
        new mapboxgl.Marker({color:'green'}).setLngLat([${userLng}, ${userLat}]).addTo(map);
        new mapboxgl.Marker({color:'red'}).setLngLat([${destLng}, ${destLat}]).addTo(map);
        const b = new mapboxgl.LngLatBounds();
        route.geometry.coordinates.forEach(c => b.extend(c));
        b.extend([${userLng}, ${userLat}]);
        b.extend([${destLng}, ${destLat}]);
        map.fitBounds(b, { padding: 40 });
      });
    </script>
  </body>
  </html>`
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  fallbackTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  fallbackText: { fontSize: 14, textAlign: 'center' },
  footer: { padding: 12, borderTopWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 8 },
  button: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  buttonText: { fontSize: 14, fontWeight: '600' },
});
