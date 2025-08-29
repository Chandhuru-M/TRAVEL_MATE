import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import type { LatLng, Place } from '@/lib/types';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic291bmRoYXJ5YSIsImEiOiJjbWU4MG0zZHcwNXJ5MmpxeGRxYW1sdWU4In0.R1lZA658526l1ZF2VxGG-w';

type Props = {
  userLocation?: LatLng | null;
  place?: Partial<Place> | null;
};

export default function PlaceMapView({ userLocation, place }: Props) {
  const webviewRef = useRef(null);

  // Build the HTML for Mapbox map with user and place markers
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
const user = [${userLocation?.lng || 0}, ${userLocation?.lat || 0}];
const dest = [${place?.longitude || place?.lng || 0}, ${place?.latitude || place?.lat || 0}];
const map = new mapboxgl.Map({ container: 'map', style: 'mapbox://styles/mapbox/streets-v11', center: user, zoom: 13 });
new mapboxgl.Marker({color:'green'}).setLngLat(user).setPopup(new mapboxgl.Popup().setText('You are here')).addTo(map);
new mapboxgl.Marker({color:'red'}).setLngLat(dest).setPopup(new mapboxgl.Popup().setText('${place?.name || 'Place'}')).addTo(map);
const bounds = new mapboxgl.LngLatBounds();
bounds.extend(user);
bounds.extend(dest);
map.fitBounds(bounds, { padding: 60 });
</script>
</body></html>`;

  useEffect(() => {
    // Optionally, you can send messages to the WebView here if needed
  }, [userLocation, place]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        originWhitelist={["*"]}
        source={{ html: mapHtml }}
        style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 220, borderRadius: 12, overflow: 'hidden' },
});
