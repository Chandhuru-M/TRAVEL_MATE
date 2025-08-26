// Lightweight OpenStreetMap fallbacks for place search when Foursquare is unavailable.
// We use Nominatim for general text search near a point, and a tiny Overpass helper
// for a few common categories to improve recall. Keep usage light and always send a UA.

export type OSMPlace = {
	id: string
	name: string
	latitude: number
	longitude: number
	address: string
	category?: string
	phone?: string
	website?: string
}

// Only set User-Agent from Node/server to comply with browser/React Native restrictions.
// Use a contact URL per Nominatim policy (your GitHub repo link as provided).
const IS_NODE = typeof process !== 'undefined' && !!(process as any)?.versions?.node
const OSM_CONTACT = (process as any)?.env?.EXPO_PUBLIC_OSM_CONTACT || 'https://github.com/Chandhuru-M/TRAVEL_MATE'
const OSM_HEADERS = IS_NODE
	? { 'User-Agent': `TRAVEL_MATE/1.0 (+${OSM_CONTACT})` }
	: {}

function toPlaceFromNominatim(item: any): OSMPlace | null {
	const lat = parseFloat(item.lat)
	const lon = parseFloat(item.lon)
	if (!isFinite(lat) || !isFinite(lon)) return null
	return {
		id: String(item.place_id || item.osm_id || `${lat},${lon}`),
		name: item.display_name?.split(',')[0] || item.namedetails?.name || item.name || 'Unknown',
		latitude: lat,
		longitude: lon,
		address: item.display_name || 'Address not available',
		category: item.category || item.type,
		phone: item.extratags?.phone || item.extratags?.contact_phone,
		website: item.extratags?.website || item.extratags?.contact_website,
	}
}

export async function nominatimSearchNearby(params: { lat: number; lon: number; query: string; limit?: number; country?: string; radius?: number }): Promise<OSMPlace[]> {
	const { lat, lon, query, limit = 12, country = 'in', radius = 10000 } = params
	const url = new URL('https://nominatim.openstreetmap.org/search')
	url.searchParams.set('format', 'jsonv2')
	url.searchParams.set('q', query)
	url.searchParams.set('limit', String(limit))
	url.searchParams.set('addressdetails', '1')
	url.searchParams.set('namedetails', '1')
	url.searchParams.set('extratags', '1')
	url.searchParams.set('accept-language', 'en')
	// Constrain to a bounding box around (lat, lon)
	const degLat = radius / 1000 / 111
	const degLon = radius / 1000 / (111 * Math.cos((lat * Math.PI) / 180) || 1)
	const minLon = lon - degLon
	const minLat = lat - degLat
	const maxLon = lon + degLon
	const maxLat = lat + degLat
	url.searchParams.set('viewbox', `${minLon},${maxLat},${maxLon},${minLat}`)
	url.searchParams.set('bounded', '1')
	url.searchParams.set('countrycodes', country)
	const res = await fetch(url.toString(), { headers: OSM_HEADERS as any })
	if (!res.ok) return []
	const data: any[] = await res.json()
	return data.map(toPlaceFromNominatim).filter(Boolean) as OSMPlace[]
}

// Small category mapping for Overpass amenity/shop keys
const OVERPASS_MAP: Record<string, { key: string; values: string[] }> = {
	restaurant: { key: 'amenity', values: ['restaurant'] },
	cafe: { key: 'amenity', values: ['cafe'] },
	coffee: { key: 'amenity', values: ['cafe'] },
	hotel: { key: 'tourism', values: ['hotel', 'guest_house'] },
	atm: { key: 'amenity', values: ['atm'] },
	bank: { key: 'amenity', values: ['bank'] },
	'fuel station': { key: 'amenity', values: ['fuel'] },
	park: { key: 'leisure', values: ['park'] },
	gym: { key: 'leisure', values: ['fitness_centre'] },
	mall: { key: 'shop', values: ['mall'] },
	supermarket: { key: 'shop', values: ['supermarket'] },
	temple: { key: 'amenity', values: ['place_of_worship'] },
}

function buildOverpassQuery(lat: number, lon: number, radius: number, key: string, values: string[]): string {
	// around:radius,lat,lon
	const orFilters = values.map((v) => `["${key}"="${v}"]`).join('')
	return `[
		out:json][timeout:25];
	(
		node${orFilters}(around:${radius},${lat},${lon});
		way${orFilters}(around:${radius},${lat},${lon});
		relation${orFilters}(around:${radius},${lat},${lon});
	);
	out center 20;`
}

export async function overpassSearchCategory(params: { lat: number; lon: number; category: string; radius?: number; limit?: number }): Promise<OSMPlace[]> {
	const { lat, lon, category, radius = 6000, limit = 20 } = params
	const map = OVERPASS_MAP[category.toLowerCase()]
	if (!map) return []
	const ql = buildOverpassQuery(lat, lon, radius, map.key, map.values)
	// Try primary Overpass instance via GET; if it fails, try a secondary mirror.
	const endpoints = [
		'https://overpass-api.de/api/interpreter',
		'https://overpass.kumi.systems/api/interpreter'
	]
	let data: any = null
	for (const ep of endpoints) {
		const res = await fetch(`${ep}?data=${encodeURIComponent(ql)}`, { headers: OSM_HEADERS as any })
		if (res.ok) { data = await res.json(); break }
	}
	if (!data) return []
	const elements: any[] = data?.elements || []
	const places: OSMPlace[] = []
	for (const el of elements) {
		const center = el.center || (el.type === 'node' ? { lat: el.lat, lon: el.lon } : undefined)
		if (!center) continue
		const name = el.tags?.name || 'Unknown'
		const addrParts = [
			el.tags?.['addr:street'],
			el.tags?.['addr:housenumber'],
			el.tags?.['addr:city'],
			el.tags?.['addr:postcode'],
			el.tags?.['addr:state'],
		].filter(Boolean)
		places.push({
			id: String(el.id),
			name,
			latitude: center.lat,
			longitude: center.lon,
			address: addrParts.join(', ') || 'Address not available',
			category: category,
			phone: el.tags?.phone || el.tags?.['contact:phone'],
			website: el.tags?.website || el.tags?.['contact:website'],
		})
		if (places.length >= limit) break
	}
	return places
}

export async function searchOSMPlaces(params: { lat: number; lon: number; query: string; categoryKey?: string | null; limit?: number; radius?: number }): Promise<OSMPlace[]> {
	const { lat, lon, query, categoryKey, limit = 12, radius = 10000 } = params
	// 1) Try category-targeted Overpass for a few categories
	if (categoryKey) {
		const viaOverpass = await overpassSearchCategory({ lat, lon, category: categoryKey, radius, limit })
		if (viaOverpass.length) return viaOverpass
	}
	// 2) Fall back to simple Nominatim search near the point
	const viaNom = await nominatimSearchNearby({ lat, lon, query, limit })
	return viaNom
}

