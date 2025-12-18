import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, StatusBar, Linking, TextInput, KeyboardAvoidingView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { WebView } from 'react-native-webview'
import { getPlaceById, fetchPlaces } from '@/lib/foursquare'
import * as Location from 'expo-location'
import useKeyboardVisible from '@/hooks/useKeyboardVisible'

// Prefer env token; fallback to the token used in GroupMapView
const MAPBOX_TOKEN = (process as any)?.env?.EXPO_PUBLIC_MAPBOX_TOKEN 
const ORS_KEY = (process as any)?.env?.EXPO_PUBLIC_OPENROUTESERVICE_API_KEY

export default function MapViewScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const [destLat, setDestLat] = useState<number | null>(params.lat ? Number(params.lat) : null)
  const [destLng, setDestLng] = useState<number | null>(params.lng ? Number(params.lng) : null)
  const destName = (params.name as string) || 'Destination'
  const [originLat, setOriginLat] = useState<number | null>(params.ulat ? Number(params.ulat) : null)
  const [originLng, setOriginLng] = useState<number | null>(params.ulng ? Number(params.ulng) : null)
  const qParam = (params.q as string) || ''
  const [searchText, setSearchText] = useState<string>('')
  const fsqId = (params.fsq_id as string) || ''
  const [mode] = useState<string>((params.mode as string) || 'walking') // walking look like screenshot
  const initialPlacesJson = (params.places as string) || ''

  const webRef = useRef<WebView>(null)
  const [htmlReady, setHtmlReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [distanceKm, setDistanceKm] = useState<number | null>(null)
  const [etaMin, setEtaMin] = useState<number | null>(null)
  const keyboardVisible = useKeyboardVisible()
  
  // simple haversine to sort by nearest
  const haversine = (aLat:number, aLng:number, bLat:number, bLng:number) => {
    const toRad = (d:number)=> d*Math.PI/180
    const R = 6371
    const dLat = toRad(bLat-aLat)
    const dLng = toRad(bLng-aLng)
    const x = Math.sin(dLat/2)**2 + Math.cos(toRad(aLat))*Math.cos(toRad(bLat))*Math.sin(dLng/2)**2
    return 2*R*Math.atan2(Math.sqrt(x), Math.sqrt(1-x))
  }

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
      const placeMarkers = {};
      function fitTo(start, end){
        const b = new mapboxgl.LngLatBounds();
        if (start) b.extend(start);
        if (end) b.extend(end);
        if (start || end) map.fitBounds(b, { padding: 50 });
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
        if (start && end) fitTo(start, end); else if (end) map.flyTo({ center:end, zoom:15 }); else if (start) map.flyTo({ center:start, zoom:15 });
      }
  window.handleMsg = (msg) => {
        try {
          if (msg.type === 'INIT') {
    const end = (msg.payload.destLat!=null && msg.payload.destLng!=null) ? [msg.payload.destLng, msg.payload.destLat] : null;
    const start = (msg.payload.originLat!=null && msg.payload.originLng!=null) ? [msg.payload.originLng, msg.payload.originLat] : null;
    addRoute(null, start, end);
          }
          if (msg.type === 'ROUTE') {
            addRoute(msg.payload.geometry, msg.payload.start, msg.payload.end);
          }
          if (msg.type === 'PLACES') {
            // clear old markers
            for (const k in placeMarkers) { try { placeMarkers[k].remove(); } catch(e){} delete placeMarkers[k]; }
            const places = msg.payload || [];
            if (Array.isArray(places) && places.length) {
              const bounds = new mapboxgl.LngLatBounds();
              places.forEach((p, idx) => {
                if (typeof p.lng === 'number' && typeof p.lat === 'number') {
                  const m = new mapboxgl.Marker({ color: 'red' }).setLngLat([p.lng, p.lat]).setPopup(new mapboxgl.Popup().setText(p.name || 'Place')).addTo(map);
                  placeMarkers[p.id || idx] = m;
                  bounds.extend([p.lng, p.lat]);
                  m.getElement().addEventListener('click', () => {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type:'PLACE_SELECTED', payload: p }));
                  });
                }
              });
              if (!bounds.isEmpty()) { map.fitBounds(bounds, { padding: 50 }); }
              try { window.ReactNativeWebView.postMessage(JSON.stringify({ type:'PLACES_RENDERED', count: places.length })); } catch(e){}
            }
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
  // before falling back to Mapbox geocoding (also biased by origin). Fetch user origin if missing.
  useEffect(() => {
    let cancelled = false

  const resolveDest = async () => {
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

      const q = qParam || (destName && destName !== 'Destination' ? destName : '')
  if (!q) return

      // 1) Try Foursquare near the user's origin (best match by proximity)
      try {
        const oLat = originLat
        const oLng = originLng
        if (oLat != null && oLng != null && (destLat == null || destLng == null)) {
          // Use same fallback approach as Home: try a few radii and fallback terms
          const radii = [5000, 10000, 20000, 30000]
          const fallbacks = [q, 'popular places']
          let found: any[] | null = null
          for (const term of fallbacks) {
            for (const r of radii) {
              try {
                const fsq = await fetchPlaces({ lat: oLat, lon: oLng, query: term, limit: 20, radius: r })
                if (fsq && fsq.length) { found = fsq as any[]; break }
              } catch {}
            }
            if (found) break
          }
          const list = found || []
          if (list.length) {
            // Sort by nearest to origin
            list.sort((a:any,b:any)=>{
              const aLat = a.latitude ?? a.geocodes?.main?.lat
              const aLng = a.longitude ?? a.geocodes?.main?.lng
              const bLat = b.latitude ?? b.geocodes?.main?.lat
              const bLng = b.longitude ?? b.geocodes?.main?.lng
              if ([aLat,aLng,bLat,bLng].some(v=>typeof v!== 'number')) return 0
              return haversine(oLat,oLng,aLat,aLng) - haversine(oLat,oLng,bLat,bLng)
            })
            const first = list[0]
            const lat = first?.latitude ?? first?.geocodes?.main?.lat
            const lng = first?.longitude ?? first?.geocodes?.main?.lng
            if (typeof lat === 'number' && typeof lng === 'number') {
              if (!cancelled) { setDestLat(lat); setDestLng(lng) }
            } else if (first?.fsq_id) {
              const detail = await getPlaceById(first.fsq_id)
              const dlat = (detail as any)?.latitude
              const dlng = (detail as any)?.longitude
              if (typeof dlat === 'number' && typeof dlng === 'number' && !cancelled) { setDestLat(dlat); setDestLng(dlng) }
            }
            // Also drop markers for UX
            const payload = list.map((p:any, i:number)=>({ id: p.fsq_id || String(i), name: p.name, lat: p.latitude ?? p.geocodes?.main?.lat, lng: p.longitude ?? p.geocodes?.main?.lng }))
            try { webRef.current?.postMessage(JSON.stringify({ type:'PLACES', payload })) } catch {}
          }
        }
      } catch {}

      // 2) Fallback to Mapbox geocoding but bias by origin proximity to avoid far-away branches
      try {
        if ((destLat == null || destLng == null)) {
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

    const init = async () => {
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

        await resolveDest()
      } finally {
        setLoading(false)
      }
    }

    init()
    // If chat passed places, draw markers immediately
    try {
      if (initialPlacesJson) {
        const parsed = JSON.parse(initialPlacesJson)
        if (Array.isArray(parsed) && parsed.length) {
          const payload = parsed.filter((p:any)=> typeof p.lat === 'number' && typeof p.lng === 'number')
          webRef.current?.postMessage(JSON.stringify({ type:'PLACES', payload }))
        }
      }
    } catch {}
    return () => { cancelled = true }
  }, [])

  // If origin arrives later (permission delay), try destination resolution again
  useEffect(() => {
    const q = qParam || (destName && destName !== 'Destination' ? destName : '')
    if (!q) return
    if (originLat == null || originLng == null) return
    if (destLat != null && destLng != null) return
    let mounted = true
    const run = async () => {
      try {
        const fsq = await fetchPlaces({ lat: originLat!, lon: originLng!, query: q, limit: 1, radius: 30000 })
        const first = fsq?.[0]
        if (!mounted) return
        if (first) {
          const lat = (first as any).latitude ?? (first as any).geocodes?.main?.lat
          const lng = (first as any).longitude ?? (first as any).geocodes?.main?.lng
          if (typeof lat === 'number' && typeof lng === 'number') {
            setDestLat(lat); setDestLng(lng)
            return
          }
          if ((first as any).fsq_id) {
            const detail = await getPlaceById((first as any).fsq_id)
            const dlat = (detail as any)?.latitude
            const dlng = (detail as any)?.longitude
            if (typeof dlat === 'number' && typeof dlng === 'number' && mounted) {
              setDestLat(dlat); setDestLng(dlng)
              return
            }
          }
        }
        // Fallback: Mapbox geocode with proximity
        const prox = `&proximity=${originLng},${originLat}`
        const gUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?types=poi&limit=1${prox}&access_token=${encodeURIComponent(MAPBOX_TOKEN)}`
        const gRes = await fetch(gUrl)
        const gData = await gRes.json()
        const center = gData?.features?.[0]?.center
        if (center && mounted) { setDestLng(center[0]); setDestLat(center[1]) }
      } catch {}
    }
    run()
    return () => { mounted = false }
  }, [originLat, originLng])

  useEffect(() => {
    if (!htmlReady) return
    // Always send INIT so markers show as soon as either point is known
    webRef.current?.postMessage(JSON.stringify({ type: 'INIT', payload: { destLat, destLng, originLat, originLng } }))
    // Compute route only when both origin and destination are available
    const doRoute = async () => {
      if (originLat == null || originLng == null) return
      if (destLat == null || destLng == null) return
      try {
        const orsProfile = (mode === 'walking') ? 'foot-walking' : 'driving-car'
        if (ORS_KEY) {
          const orsRes = await fetch(`https://api.openrouteservice.org/v2/directions/${orsProfile}`, {
            method: 'POST',
            headers: {
              'Authorization': ORS_KEY,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              coordinates: [ [originLng, originLat], [destLng, destLat] ],
              instructions: false,
              geometry: true,
              geometry_format: 'geojson',
            }),
          })
          const ors = await orsRes.json()
          const feat = ors?.features?.[0]
          const geometry = feat?.geometry
          const summary = feat?.properties?.summary
          if (geometry) {
            webRef.current?.postMessage(JSON.stringify({ type: 'ROUTE', payload: { geometry, start: [originLng, originLat], end: [destLng, destLat] } }))
            if (summary?.distance != null) setDistanceKm(Math.max(0, summary.distance / 1000))
            if (summary?.duration != null) setEtaMin(Math.max(1, Math.round(summary.duration / 60)))
            return
          }
        }
        // Fallback to Mapbox if ORS key missing or failed
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

  // Handle messages from the map for place selection
  const onWebMessage = (event: any) => {
    try {
      const data = JSON.parse(event?.nativeEvent?.data)
      if (data?.type === 'PLACE_SELECTED' && data?.payload) {
        const p = data.payload
        if (typeof p.lat === 'number' && typeof p.lng === 'number') {
          setDestLat(p.lat)
          setDestLng(p.lng)
        }
      }
    } catch {}
  }

  // Search nearby places via Foursquare and drop markers
  const searchNearby = async (term: string) => {
    const query = term?.trim()
    if (!query) return
    let oLat = originLat, oLng = originLng
    if (oLat == null || oLng == null) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({})
          oLat = loc.coords.latitude; oLng = loc.coords.longitude
          setOriginLat(oLat); setOriginLng(oLng)
        }
      } catch {}
    }
    if (oLat == null || oLng == null) return
    try {
      // Same fallback as Home screen
      const radii = [5000, 10000, 20000, 30000]
      const fallbacks = [query, 'popular places']
      let list: any[] = []
      for (const term2 of fallbacks) {
        for (const r of radii) {
          try {
            const res = await fetchPlaces({ lat: oLat, lon: oLng, query: term2, limit: 20, radius: r })
            if (res && res.length) { list = res as any[]; break }
          } catch {}
        }
        if (list.length) break
      }
      const payload = list.map((p:any, i:number) => ({ id: p.fsq_id || String(i), name: p.name, lat: p.latitude ?? p.geocodes?.main?.lat, lng: p.longitude ?? p.geocodes?.main?.lng }))
      webRef.current?.postMessage(JSON.stringify({ type: 'PLACES', payload }))
      // pick nearest valid as destination
      const withCoords = payload.filter(x => typeof x.lat === 'number' && typeof x.lng === 'number')
      if (withCoords.length) {
        withCoords.sort((a,b)=> haversine(oLat!,oLng!,a.lat,a.lng) - haversine(oLat!,oLng!,b.lat,b.lng))
        setDestLat(withCoords[0].lat); setDestLng(withCoords[0].lng)
      }
    } catch {}
  }

  return (
  <KeyboardAvoidingView style={styles.container} behavior={(Platform.OS as string) === 'ios' ? 'padding' : 'height'}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.link}>Close</Text></TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{destName}</Text>
        <View style={{ width: 48 }} />
      </View>
      <View style={{ flex: 1, backgroundColor: '#e5e7eb' }}>
        {/* Simple search bar */}
        <View style={styles.searchBar}>
          <TextInput
            placeholder="Search places (e.g., hotel, restaurant)"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={() => searchNearby(searchText)}
            style={styles.searchInput}
            placeholderTextColor="#6b7280"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={() => searchNearby(searchText)}>
            <Text style={{ color: 'white', fontWeight: '700' }}>Go</Text>
          </TouchableOpacity>
        </View>
        <WebView ref={webRef} originWhitelist={["*"]} source={{ html }} style={{ flex:1 }} onLoadEnd={() => setHtmlReady(true)} onMessage={onWebMessage} />
        {loading && (
          <View style={styles.loadingOverlay}><ActivityIndicator color="#111827" /></View>
        )}
        {/* Open in Google Maps (walking) button */}
  {destLat != null && destLng != null && !keyboardVisible && (
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
  {distanceKm != null && !keyboardVisible && (
          <View style={styles.infoBar}>
            <Text style={styles.infoText}>Distance: {distanceKm.toFixed(1)} km{etaMin != null ? ` • ETA: ${etaMin} min` : ''}</Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
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
  searchBar: {
    position: 'absolute',
    top: (Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0) + 56,
    left: 12,
    right: 12,
    zIndex: 1000,
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderColor: '#e5e7eb',
    borderWidth: 1,
    color: '#111827',
  },
  searchBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
