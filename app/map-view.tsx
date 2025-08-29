import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, StatusBar, Linking } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { WebView } from 'react-native-webview'
import { getPlaceById, fetchPlaces } from '@/lib/foursquare'
import * as Location from 'expo-location'

// Prefer env token; fallback to the token used in GroupMapView
const MAPBOX_TOKEN = (process as any)?.env?.EXPO_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1Ijoic291bmRoYXJ5YSIsImEiOiJjbWU4MG0zZHcwNXJ5MmpxeGRxYW1sdWU4In0.R1lZA658526l1ZF2VxGG-w'

export default function MapViewScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const [destLat, setDestLat] = useState<number | null>(params.lat ? Number(params.lat) : null)
  const [destLng, setDestLng] = useState<number | null>(params.lng ? Number(params.lng) : null)
  const destName = (params.name as string) || 'Destination'
  const [originLat, setOriginLat] = useState<number | null>(params.ulat ? Number(params.ulat) : null)
  const [originLng, setOriginLng] = useState<number | null>(params.ulng ? Number(params.ulng) : null)
  const q = (params.q as string) || ''
  const fsqId = (params.fsq_id as string) || ''
  const [mode] = useState<string>((params.mode as string) || 'walking') // walking look like screenshot

  const webRef = useRef<WebView>(null)
  const [htmlReady, setHtmlReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [distanceKm, setDistanceKm] = useState<number | null>(null)
  const [etaMin, setEtaMin] = useState<number | null>(null)

  const html = useMemo(() => `<!DOCTYPE html><html><head>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'/>
    <script src='https://api.mapbox.com/mapbox-gl-js/v2.13.0/mapbox-gl.js'></script>
    <link href='https://api.mapbox.com/mapbox-gl-js/v2.13.0/mapbox-gl.css' rel='stylesheet'/>
    <style>html,body{margin:0;height:100%}#map{height:100%;width:100%}</style>
  </head><body>
    <div id='map'></div>
    <script>
      mapboxgl.accessToken = '${MAPBOX_TOKEN}';
      const map = new mapboxgl.Map({ container:'map', style:'mapbox://styles/mapbox/streets-v11', center:[0,0], zoom:2 });
      let mapReady = false;
      map.on('load', () => {
        mapReady = true;
        // Flush any queued messages that arrived before style load
        if (window._queuedMsgs && window._queuedMsgs.length) {
          for (const m of window._queuedMsgs) window.handleMsg(m);
          window._queuedMsgs = [];
        }
      });
      let routeAdded = false;
      let destMarker = null; let originMarker = null;
      function fitTo(start, end){
        const b = new mapboxgl.LngLatBounds();
        if (start) b.extend(start);
        if (end) b.extend(end);
        map.fitBounds(b, { padding: 50 });
      }
      function addRoute(geometry, start, end){
        try {
          if (map.getSource('route')) { map.removeLayer('route'); }
          if (map.getSource('route-halo')) { map.removeLayer('route-halo'); }
          if (map.getSource('route')) { map.removeSource('route'); }
        } catch {}
        if (geometry && mapReady) {
          try {
            map.addSource('route', { type:'geojson', data: { type:'Feature', geometry } });
            // Halo for better contrast
            map.addLayer({ id:'route-halo', type:'line', source:'route', paint: { 'line-color':'#ffffff', 'line-width':6, 'line-opacity':0.6 } });
            // Dotted blue line similar to Google walking
            map.addLayer({ id:'route', type:'line', source:'route', paint: { 'line-color':'#1A73E8', 'line-width':4, 'line-dasharray':[1, 1.2] } });
            routeAdded = true;
          } catch (e) { /* ignore */ }
        }
        if (start) { if (originMarker) originMarker.remove(); originMarker = new mapboxgl.Marker({color:'green'}).setLngLat(start).addTo(map); }
        if (end) { if (destMarker) destMarker.remove(); destMarker = new mapboxgl.Marker({color:'red'}).setLngLat(end).addTo(map); }
        if (start && end) fitTo(start, end); else if (end) map.flyTo({ center:end, zoom:15 });
      }
      window.handleMsg = (msg) => {
        try {
          if (msg.type === 'INIT') {
            const end = [msg.payload.destLng, msg.payload.destLat];
            const start = (msg.payload.originLat!=null && msg.payload.originLng!=null) ? [msg.payload.originLng, msg.payload.originLat] : null;
            addRoute(null, start, end);
          }
          if (msg.type === 'ROUTE') {
            addRoute(msg.payload.geometry, msg.payload.start, msg.payload.end);
          }
        } catch {}
      };
      document.addEventListener('message', (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (!mapReady) {
            if (!window._queuedMsgs) window._queuedMsgs = [];
            window._queuedMsgs.push(msg);
          } else {
            window.handleMsg(msg);
          }
        } catch {}
      });
    </script>
  </body></html>`, [MAPBOX_TOKEN])

  // Resolve destination via Foursquare id first (precise). If only a name is provided, prefer a nearby Foursquare search (biased by origin)
  // before falling back to Mapbox geocoding (also biased by origin). Fetch user origin if missing; then draw route and compute stats.
  useEffect(() => {
    let cancelled = false
    const resolveAndDraw = async () => {
      try {
        // If origin missing, try device location ASAP so we can bias searches by proximity
        if (originLat == null || originLng == null) {
          try {
            const { status } = await Location.requestForegroundPermissionsAsync()
            if (status === 'granted') {
              const loc = await Location.getCurrentPositionAsync({})
              if (!cancelled) {
                setOriginLat(loc.coords.latitude)
                setOriginLng(loc.coords.longitude)
              }
            }
          } catch {}
        }

        // Prefer exact FSQ coordinates if id provided
        if ((destLat == null || destLng == null) && fsqId) {
          try {
            const place = await getPlaceById(fsqId)
            if (place?.latitude != null && place?.longitude != null && !cancelled) {
              setDestLat(place.latitude)
              setDestLng(place.longitude)
            }
          } catch {}
        }
        // Otherwise resolve destination by query if lat/lng still missing
        if ((destLat == null || destLng == null) && q) {
          // 1) Try Foursquare near the user's origin (best match by proximity)
          try {
            const oLat = originLat
            const oLng = originLng
            if (oLat != null && oLng != null) {
              const fsq = await fetchPlaces({ lat: oLat, lon: oLng, query: q, limit: 1, radius: 30000 })
              const first = fsq?.[0]
              if (first) {
                const lat = (first as any).latitude ?? (first as any).geocodes?.main?.lat
                const lng = (first as any).longitude ?? (first as any).geocodes?.main?.lng
                if (typeof lat === 'number' && typeof lng === 'number') {
                  if (!cancelled) {
                    setDestLat(lat)
                    setDestLng(lng)
                  }
                } else if ((first as any).fsq_id) {
                  const detail = await getPlaceById((first as any).fsq_id)
                  const dlat = (detail as any)?.latitude
                  const dlng = (detail as any)?.longitude
                  if (typeof dlat === 'number' && typeof dlng === 'number' && !cancelled) {
                    setDestLat(dlat)
                    setDestLng(dlng)
                  }
                }
              }
            }
          } catch {}

          // 2) Fallback to Mapbox geocoding but bias by origin proximity to avoid far-away branches
          try {
            if (destLat == null || destLng == null) {
              const prox = (originLat != null && originLng != null) ? `&proximity=${originLng},${originLat}` : ''
              const gUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?types=poi&limit=1${prox}&access_token=${encodeURIComponent(MAPBOX_TOKEN)}`
              const gRes = await fetch(gUrl)
              const gData = await gRes.json()
              const center = gData?.features?.[0]?.center
              if (center && !cancelled) {
                setDestLng(center[0])
                setDestLat(center[1])
              }
            }
          } catch {}
        }
      } finally {
        setLoading(false)
      }
    }
    resolveAndDraw()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!htmlReady) return
    if (destLat == null || destLng == null) return
    // Send initial markers
    webRef.current?.postMessage(JSON.stringify({ type: 'INIT', payload: { destLat, destLng, originLat, originLng } }))
  const doRoute = async () => {
      if (originLat == null || originLng == null) return
      try {
    const profile = (mode === 'walking') ? 'walking' : 'driving'
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${originLng},${originLat};${destLng},${destLat}?steps=false&geometries=geojson&access_token=${encodeURIComponent(MAPBOX_TOKEN)}`
        const res = await fetch(url)
        const data = await res.json()
        const route = data?.routes?.[0]
        if (route?.geometry) {
          webRef.current?.postMessage(JSON.stringify({ type: 'ROUTE', payload: { geometry: route.geometry, start: [originLng, originLat], end: [destLng, destLat] } }))
          if (typeof route.distance === 'number') setDistanceKm(Math.max(0, route.distance / 1000))
          if (typeof route.duration === 'number') setEtaMin(Math.max(1, Math.round(route.duration / 60)))
        }
      } catch {}
    }
  doRoute()
  }, [htmlReady, destLat, destLng, originLat, originLng, mode])

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.link}>Close</Text></TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{destName}</Text>
        <View style={{ width: 48 }} />
      </View>
      <View style={{ flex: 1, backgroundColor: '#e5e7eb' }}>
        <WebView ref={webRef} originWhitelist={["*"]} source={{ html }} style={{ flex:1 }} onLoadEnd={() => setHtmlReady(true)} />
        {loading && (
          <View style={styles.loadingOverlay}><ActivityIndicator color="#111827" /></View>
        )}
        {/* Open in Google Maps (walking) button */}
        {destLat != null && destLng != null && (
          <TouchableOpacity
            style={styles.gmapsFab}
            onPress={() => {
              if (originLat != null && originLng != null) {
                const origin = encodeURIComponent(`${originLat},${originLng}`)
                const dest = encodeURIComponent(`${destLat},${destLng}`)
                const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=${mode}`
                Linking.openURL(url).catch(() => {})
              } else {
                const query = encodeURIComponent(`${destLat},${destLng}`)
                const url = `https://www.google.com/maps/search/?api=1&query=${query}`
                Linking.openURL(url).catch(() => {})
              }
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>Open in Google Maps</Text>
          </TouchableOpacity>
        )}
        {distanceKm != null && (
          <View style={styles.infoBar}>
            <Text style={styles.infoText}>Distance: {distanceKm.toFixed(1)} km{etaMin != null ? ` • ETA: ${etaMin} min` : ''}</Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  topBar: {
    position: 'absolute',
    top: (Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0) + 8,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.92)',
    zIndex: 1000,
    elevation: 4,
  },
  title: { fontSize: 16, fontWeight: '600' },
  link: { color: '#2563eb', fontWeight: '600' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  infoBar: { position: 'absolute', bottom: 12, left: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  infoText: { color: 'white', fontWeight: '600', textAlign: 'center' },
  gmapsFab: {
    position: 'absolute',
    right: 12,
    bottom: 70,
    backgroundColor: '#1A73E8',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    elevation: 3,
  },
})
