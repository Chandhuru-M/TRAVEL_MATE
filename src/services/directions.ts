export type LatLng = { lat: number; lng: number }

export type RouteStep = {
  instruction: string
  distance_m: number
  duration_s: number
  maneuver?: { location: [number, number]; instruction?: string }
}

export type RouteSummary = {
  distance_m: number
  duration_s: number
  steps: RouteStep[]
  geometry?: { type: 'LineString'; coordinates: number[][] }
}

function msToText(meters: number): string {
  if (!isFinite(meters)) return '-'
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

function secToText(sec: number): string {
  if (!isFinite(sec)) return '-'
  const m = Math.round(sec / 60)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return `${h} hr ${rm} min`
}

export function summarizeForSpeech(summary: RouteSummary): string {
  const head = `Route is ${msToText(summary.distance_m)}, about ${secToText(summary.duration_s)}.`
  const first = summary.steps.slice(0, 4).map((s, i) => `${i + 1}. ${s.instruction}`).join(' ')
  return `${head} ${first}`
}

const ORS_KEY = (process as any)?.env?.EXPO_PUBLIC_OPENROUTESERVICE_API_KEY || (process as any)?.env?.OPENROUTESERVICE_API_KEY
const MAPBOX_TOKEN = (process as any)?.env?.EXPO_PUBLIC_MAPBOX_TOKEN

export async function getRouteORS(start: LatLng, end: LatLng): Promise<RouteSummary> {
  // Try direct call; if fails on web due to CORS, caller should handle fallback
  if (!ORS_KEY) throw new Error('OpenRouteService API key missing')
  const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${encodeURIComponent(ORS_KEY)}&start=${start.lng},${start.lat}&end=${end.lng},${end.lat}`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`ORS error ${r.status}`)
  const d = await r.json()
  const feat = d?.features?.[0]
  const seg = feat?.properties?.segments?.[0]
  const stepsRaw = seg?.steps || []
  const steps: RouteStep[] = stepsRaw.map((s: any) => ({
    instruction: s?.instruction || 'Continue',
    distance_m: s?.distance || 0,
    duration_s: s?.duration || 0,
  }))
  return {
    distance_m: seg?.distance || feat?.properties?.summary?.distance || 0,
    duration_s: seg?.duration || feat?.properties?.summary?.duration || 0,
    steps,
    geometry: feat?.geometry || undefined,
  }
}

export async function getRouteMapbox(start: LatLng, end: LatLng, profile: 'driving' | 'walking' | 'cycling' = 'driving'): Promise<RouteSummary> {
  if (!MAPBOX_TOKEN) throw new Error('Mapbox token missing')
  const mapProfile = profile === 'cycling' ? 'cycling' : profile === 'walking' ? 'walking' : 'driving'
  const url = `https://api.mapbox.com/directions/v5/mapbox/${mapProfile}/${start.lng},${start.lat};${end.lng},${end.lat}?steps=true&geometries=geojson&overview=full&access_token=${encodeURIComponent(MAPBOX_TOKEN)}`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`Mapbox directions error ${r.status}`)
  const d = await r.json()
  const route = d?.routes?.[0]
  const leg = route?.legs?.[0]
  const stepsRaw = leg?.steps || []
  const steps: RouteStep[] = stepsRaw.map((s: any) => ({
    instruction: s?.maneuver?.instruction || 'Continue',
    distance_m: s?.distance || 0,
    duration_s: s?.duration || 0,
    maneuver: s?.maneuver?.location ? { location: s.maneuver.location, instruction: s?.maneuver?.instruction } : undefined,
  }))
  return {
    distance_m: route?.distance || 0,
    duration_s: route?.duration || 0,
    steps,
    geometry: route?.geometry || undefined,
  }
}

export async function getBestRoute(start: LatLng, end: LatLng, profile: 'driving' | 'walking' | 'cycling' = 'driving'): Promise<RouteSummary> {
  try {
    // Prefer Mapbox per product requirements; fall back to ORS if Mapbox or token fails
    return await getRouteMapbox(start, end, profile)
  } catch {
    return await getRouteORS(start, end)
  }
}

export const format = { msToText, secToText }

export async function geocodeMapbox(query: string, proximity?: LatLng): Promise<LatLng | null> {
  if (!MAPBOX_TOKEN) throw new Error('Mapbox token missing')
  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`)
  url.searchParams.set('access_token', MAPBOX_TOKEN)
  url.searchParams.set('limit', '1')
  if (proximity) url.searchParams.set('proximity', `${proximity.lng},${proximity.lat}`)
  const r = await fetch(url.toString())
  if (!r.ok) return null
  const d = await r.json()
  const f = d?.features?.[0]
  if (!f?.center) return null
  return { lng: f.center[0], lat: f.center[1] }
}
