import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
// Import WebView only on web to avoid RNCWebView not found in Expo Go
const WebView: any = Platform.OS === 'web' ? require('react-native-webview').WebView : null
import * as Location from 'expo-location'
import * as Speech from 'expo-speech'
import { getBestRoute, geocodeMapbox, type LatLng, type RouteSummary } from '@/services/directions'

export default function LiveNavigation() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const destLat = Number(params.lat)
  const destLng = Number(params.lng)
  const destName = (params.name as string) || 'Destination'
  const profile = (params.profile as string) as 'walking' | 'driving' | 'cycling' || 'driving'

  const [user, setUser] = useState<LatLng | null>(null)
  const [route, setRoute] = useState<RouteSummary | null>(null)
  const [search, setSearch] = useState('')
  const webRef = useRef<any>(null)
  const token = (process as any)?.env?.EXPO_PUBLIC_MAPBOX_TOKEN

  useEffect(() => {
    let watchSub: Location.LocationSubscription | null = null
    let nextStep = 0
    const dist = (a: LatLng, b: LatLng) => {
      const toRad = (d:number)=> d*Math.PI/180
      const R = 6371e3
      const dLat = toRad(b.lat-a.lat)
      const dLon = toRad(b.lng-a.lng)
      const x = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLon/2)**2
      return 2*R*Math.atan2(Math.sqrt(x), Math.sqrt(1-x))
    }
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return
      const loc = await Location.getCurrentPositionAsync({})
      const me = { lat: loc.coords.latitude, lng: loc.coords.longitude }
      setUser(me)
      try {
        const r = await getBestRoute(me, { lat: destLat, lng: destLng }, profile)
        setRoute(r)
        Speech.speak(`Starting ${profile} navigation to ${destName}. ${Math.round(r.distance_m/1000)} kilometers, about ${Math.round(r.duration_s/60)} minutes.`)
      } catch {}
      watchSub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 5 }, (p) => {
        const me2 = { lat: p.coords.latitude, lng: p.coords.longitude }
        setUser(me2)
        // Push location updates to WebView for marker move
        webRef.current?.postMessage(JSON.stringify({ type: 'user-location', payload: me2 }))
        // Simple turn-by-turn: speak next step when within ~40m of its maneuver point
        if (route?.steps?.length) {
          const steps = route.steps
          if (nextStep < steps.length && steps[nextStep]?.maneuver?.location) {
            const [lng, lat] = steps[nextStep].maneuver!.location
            const d = dist(me2, { lat, lng })
            if (d < 40) {
              const instr = steps[nextStep].maneuver?.instruction || steps[nextStep].instruction
              if (instr) Speech.speak(instr, { rate: 1.0 })
              nextStep += 1
            }
          }
        }
      })
    })()
    return () => {
      Speech.stop()
      watchSub?.remove()
    }
  }, [destLat, destLng, profile])

  const html = useMemo(() => {
    if (!token) return '<html><body><p style="font-family:sans-serif">Missing EXPO_PUBLIC_MAPBOX_TOKEN</p></body></html>'
    const r = route?.geometry ? JSON.stringify({ type: 'Feature', geometry: route.geometry }) : 'null'
    const start = user ? `[${user.lng}, ${user.lat}]` : 'null'
    const end = `[${destLng}, ${destLat}]`
    return `<!DOCTYPE html><html><head>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'/>
    <script src='https://api.mapbox.com/mapbox-gl-js/v2.13.0/mapbox-gl.js'></script>
    <link href='https://api.mapbox.com/mapbox-gl-js/v2.13.0/mapbox-gl.css' rel='stylesheet'/>
    <style>html,body{margin:0;height:100%}#map{height:100%;width:100%}</style>
    </head><body>
    <div id='map'></div>
    <script>
      mapboxgl.accessToken = '${token}';
      const map = new mapboxgl.Map({ container:'map', style:'mapbox://styles/mapbox/streets-v11', center:${end}, zoom:13 });
      const route = ${r};
      const start = ${start};
      const end = ${end};
      if (route) {
        map.on('load', () => {
          map.addSource('route', { type:'geojson', data: route });
          map.addLayer({ id:'route', type:'line', source:'route', paint:{ 'line-color':'#1D4ED8', 'line-width':4 }});
          if (start) new mapboxgl.Marker({color:'green'}).setLngLat(start).addTo(map);
          new mapboxgl.Marker({color:'red'}).setLngLat(end).addTo(map);
          const b = new mapboxgl.LngLatBounds();
          route.geometry.coordinates.forEach(c=>b.extend(c));
          if (start) b.extend(start);
          b.extend(end);
          map.fitBounds(b, { padding: 40 });
        })
      }
      let userMarker = null;
      window.document.addEventListener('message', (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'user-location') {
            const p = [msg.payload.lng, msg.payload.lat];
            if (!userMarker) userMarker = new mapboxgl.Marker({ color: '#16a34a' }).setLngLat(p).addTo(map);
            else userMarker.setLngLat(p);
          }
        } catch {}
      })
    </script>
    </body></html>`
  }, [token, route, user, destLat, destLng])

  const onSearch = async () => {
    if (!search.trim()) return
    const p = await geocodeMapbox(search, user ?? undefined)
    if (p) router.replace({ pathname: '/live-navigation' as any, params: { lat: String(p.lat), lng: String(p.lng), name: search, profile } })
  }

  // On native, avoid embedded map and suggest opening Google Maps from directions instead
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}><Text style={styles.link}>Close</Text></TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>{destName}</Text>
          <View style={{ width: 48 }} />
        </View>
        <View style={{ padding: 16 }}>
          <Text>Live navigation preview is available on web. Use the Directions screen to open Google Maps for native navigation.</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.link}>Close</Text></TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{destName}</Text>
        <View style={{ width: 48 }} />
      </View>
      <View style={styles.searchBar}>
        <TextInput placeholder='Search any place' value={search} onChangeText={setSearch} style={styles.input} />
        <TouchableOpacity onPress={onSearch} style={styles.searchBtn}><Text style={{ color: 'white' }}>Search</Text></TouchableOpacity>
      </View>
      <View style={{ flex: 1, backgroundColor: '#e5e7eb' }}>
        {WebView ? <WebView ref={webRef} originWhitelist={["*"]} source={{ html }} style={{ flex:1 }} /> : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  topBar: { paddingTop: 10, paddingHorizontal: 12, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '600' },
  link: { color: '#2563eb', fontWeight: '600' },
  searchBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 6 },
  searchBtn: { backgroundColor: '#2563eb', borderRadius: 10, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
})
