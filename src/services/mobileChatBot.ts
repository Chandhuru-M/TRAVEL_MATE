// Mobile-native chatbot: Foursquare for places, OpenWeather for weather, optional Gemini for open-ended replies.
// Deterministic logic for places; Gemini only used as a last resort for general Q&A.

export type LatLng = { lat: number; lng: number }
export type Budget = { amount: number; currency: string }
export type Place = {
	id: string
	name: string
	latitude: number
	longitude: number
	address: string
	category?: string
	rating?: number
	phone?: string
	website?: string
	priceLevel?: number
	openNow?: boolean
	hours?: string
}

export type ChatResponse = { reply: string; places?: Place[] }

const OPENWEATHER_KEY = (process as any)?.env?.EXPO_PUBLIC_OPENWEATHER_API_KEY || (process as any)?.env?.OPENWEATHER_API_KEY
const FSQ_KEY = (process as any)?.env?.EXPO_PUBLIC_FOURSQUARE_API_KEY || (process as any)?.env?.FOURSQUARE_API_KEY || (process as any)?.env?.NEXT_PUBLIC_FOURSQUARE_API_KEY
const FSQ_API_VERSION = (process as any)?.env?.EXPO_PUBLIC_FOURSQUARE_API_VERSION || '2025-06-17'
const MAPBOX_TOKEN = (process as any)?.env?.EXPO_PUBLIC_MAPBOX_TOKEN
const FORCE_MAPBOX_ONLY = (() => {
	const v = (process as any)?.env?.EXPO_PUBLIC_FORCE_MAPBOX_ONLY
	if (v == null) return false
	const s = String(v).toLowerCase()
	return s === '1' || s === 'true' || s === 'yes'
})()
// Optional Gemini
const GEMINI_KEY = (process as any)?.env?.EXPO_PUBLIC_GEMINI_API_KEY || (process as any)?.env?.GEMINI_API_KEY
const GEMINI_MODEL = (process as any)?.env?.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-1.5-flash'

function kmDistance(a: LatLng, b: LatLng) {
	const toRad = (d: number) => (d * Math.PI) / 180
	const R = 6371
	const dLat = toRad(b.lat - a.lat)
	const dLon = toRad(b.lng - a.lng)
	const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
	return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

import { searchPlacesBasic, searchPlacesByParams } from '../lib/foursquare'

async function getWeather(loc: LatLng) {
	if (!OPENWEATHER_KEY) throw new Error('OpenWeather API key missing')
	const url = `https://api.openweathermap.org/data/2.5/weather?lat=${loc.lat}&lon=${loc.lng}&appid=${OPENWEATHER_KEY}&units=metric`
	const r = await fetch(url)
	if (!r.ok) throw new Error('Weather API error')
	const d = await r.json()
	const desc = d.weather?.[0]?.description || 'unknown'
	const temp = d.main?.temp != null ? Math.round(d.main.temp) : null
	const feels = d.main?.feels_like != null ? Math.round(d.main.feels_like) : null
	const humidity = d.main?.humidity
	let s = `Current weather: ${desc}, ${temp}°C${feels ? ` (feels ${feels}°C)` : ''}`
	if (humidity != null) s += `, humidity ${humidity}%`
	return s
}

let lastFsqRateLimitedAt = 0
const FSQ_COOLDOWN_MS = 60_000

const ALLOW_DEV_SYNTHETIC = (() => {
	const v = (process as any)?.env?.ALLOW_DEV_SYNTHETIC_PLACES
	if (v == null) return true
	const s = String(v).toLowerCase()
	return s === '1' || s === 'true' || s === 'yes'
})()

function syntheticPlacesNear(loc: LatLng, query: string, count = 5): Place[] {
	const base = query.trim() ? query.trim().replace(/\s+/g, ' ') : 'Place'
	const out: Place[] = []
	for (let i = 0; i < count; i++) {
		const dLat = ((Math.random() - 0.5) * 0.02)
		const dLon = ((Math.random() - 0.5) * 0.02) / Math.cos((loc.lat * Math.PI) / 180)
		out.push({
			id: `synthetic_${base}_${i}`,
			name: `${base.charAt(0).toUpperCase() + base.slice(1)} Spot ${i + 1}`,
			latitude: loc.lat + dLat,
			longitude: loc.lng + dLon,
			address: 'Near your location',
			category: base,
		})
	}
	return out
}

async function askGemini(prompt: string, userMessage?: string): Promise<string | null> {
	if (!GEMINI_KEY) return null
	try {
		const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`
		const contents: any[] = []
		if (prompt) contents.push({ role: 'user', parts: [{ text: prompt }] })
		if (userMessage) contents.push({ role: 'user', parts: [{ text: userMessage }] })
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ contents }),
		} as any)
		if (!res.ok) return null
		const data: any = await res.json()
		const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join('\n')
		return (typeof text === 'string' && text.trim()) ? text.trim() : null
	} catch {
		return null
	}
}

async function searchPlaces(loc: LatLng, query: string, limit = 10, radius = 10000): Promise<Place[]> {
	const qNorm = query.trim().toLowerCase()
	const synonyms: string[] = (() => {
		if (/^hotel/.test(qNorm) || /lodg|inn|guest/.test(qNorm)) return ['hotel', 'lodging', 'inn', 'guest house']
		if (/^gym/.test(qNorm) || /fitness|workout/.test(qNorm)) return ['gym', 'fitness center', 'health club', 'sports club']
		if (/^restaurant|food|eat|diner|cafe/.test(qNorm)) return ['restaurant', 'food', 'diner', 'cafe', 'eatery']
		if (/^atm|cash/.test(qNorm)) return ['atm', 'bank atm', 'bank']
		if (/^temple|buddhist|monastery|pagoda|shrine/.test(qNorm)) return ['temple', 'buddhist temple', 'shrine', 'monastery', 'pagoda']
		if (/^park|garden/.test(qNorm)) return ['park', 'garden']
		if (/^cafe|coffee/.test(qNorm)) return ['cafe', 'coffee shop']
		return [query]
	})()

	const FSQ_CATEGORIES: Record<string, string[]> = {
		restaurant: ['13065'],
		cafe: ['13032'],
		coffee: ['13032'],
		bar: ['13003'],
		pub: ['13003'],
		bakery: ['13040'],
		supermarket: ['17114'],
		grocery: ['17114'],
		hotel: ['19014'],
		mall: ['19009'],
		park: ['16032'],
		museum: ['16025'],
		temple: ['12005'],
		pharmacy: ['17069'],
		hospital: ['15014'],
		gym: ['18024'],
		spa: ['17067'],
		salon: ['17068'],
		stadium: ['18018'],
		zoo: ['16044'],
		library: ['12018'],
		university: ['12017'],
		school: ['12016'],
		airport: ['19040'],
		'bus station': ['15046'],
		'train station': ['15047'],
		'metro station': ['15048'],
		parking: ['19030'],
		bank: ['12009'],
		atm: ['12040'],
		'fuel station': ['17110'],
	}

	const categoryKey = (() => {
		if (/^hotel|lodg|inn|guest/.test(qNorm)) return 'hotel'
		if (/^gym|fitness|workout|sports/.test(qNorm)) return 'gym'
		if (/^restaurant|food|eat|diner|eatery/.test(qNorm)) return 'restaurant'
		if (/^cafe|coffee/.test(qNorm)) return 'cafe'
		if (/^atm|cash/.test(qNorm)) return 'atm'
		if (/^bank/.test(qNorm)) return 'bank'
		if (/^temple|shrine|monastery|pagoda/.test(qNorm)) return 'temple'
		if (/^park|garden/.test(qNorm)) return 'park'
		if (/^mall|shopping/.test(qNorm)) return 'mall'
		if (/^museum/.test(qNorm)) return 'museum'
		if (/^pharmacy|chemist|drugstore/.test(qNorm)) return 'pharmacy'
		if (/^hospital|clinic/.test(qNorm)) return 'hospital'
		if (/^supermarket|grocery|mart/.test(qNorm)) return 'supermarket'
		if (/^fuel|gas|petrol/.test(qNorm)) return 'fuel station'
		return null
	})()

	// Mapbox-only mode
	if (FORCE_MAPBOX_ONLY && MAPBOX_TOKEN) {
		const degLat = radius / 1000 / 111
		const degLon = radius / 1000 / (111 * Math.cos((loc.lat * Math.PI) / 180) || 1)
		const minLon = loc.lng - degLon
		const minLat = loc.lat - degLat
		const maxLon = loc.lng + degLon
		const maxLat = loc.lat + degLat
		for (const term of synonyms) {
			const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(term)}.json`)
			url.searchParams.set('types', 'poi')
			url.searchParams.set('proximity', `${loc.lng},${loc.lat}`)
			url.searchParams.set('limit', String(Math.max(limit, 20)))
			url.searchParams.set('language', 'en')
			url.searchParams.set('country', 'IN')
			url.searchParams.set('bbox', `${minLon},${minLat},${maxLon},${maxLat}`)
			url.searchParams.set('access_token', MAPBOX_TOKEN)
			const r = await fetch(url.toString())
			if (!r.ok) continue
			const j = await r.json()
			const features = j?.features || []
			const out = features.map((f: any) => ({
				id: f.id,
				name: f.text || f.place_name || 'Unknown',
				latitude: f.center?.[1],
				longitude: f.center?.[0],
				address: f.properties?.address || f.place_name || 'Address not available',
				category: f.properties?.category || 'Place',
				rating: undefined,
			} as Place)).filter((p: Place) => p.latitude && p.longitude)
			if (out.length) return out
		}
		return []
	}

	try {
		if (!FSQ_KEY) throw new Error('Foursquare API key missing')
		if (Date.now() - lastFsqRateLimitedAt < FSQ_COOLDOWN_MS) throw new Error('FSQ_RATE_LIMIT')

		if (categoryKey && FSQ_CATEGORIES[categoryKey]) {
			try {
				const fsqByCat = await searchPlacesByParams({ lat: loc.lat, lon: loc.lng, categories: FSQ_CATEGORIES[categoryKey], limit, radius })
				const mappedCat: Place[] = fsqByCat.map((p: any) => ({
					id: p.id,
					name: p.name,
					latitude: p.latitude,
					longitude: p.longitude,
					address: p.address || 'Address not available',
					category: p.category,
					rating: p.rating,
					phone: p.phone,
					website: p.website,
					priceLevel: p.priceLevel,
					openNow: p.openNow,
					hours: p.hours,
				}))
				if (mappedCat.length) return mappedCat
			} catch (e: any) {
				if (e?.message === 'FSQ_RATE_LIMIT') throw e
			}
		}

		const fsq = await searchPlacesBasic({ lat: loc.lat, lon: loc.lng, query, limit, radius })
		const mappedFsq: Place[] = fsq.map((p: any) => ({
			id: p.id,
			name: p.name,
			latitude: p.latitude,
			longitude: p.longitude,
			address: p.address || 'Address not available',
			category: p.category,
			rating: p.rating,
			phone: p.phone,
			website: p.website,
			priceLevel: p.priceLevel,
			openNow: p.openNow,
			hours: p.hours,
		}))
		if (mappedFsq.length > 0) return mappedFsq

		// Mapbox fallback
		if (MAPBOX_TOKEN) {
			const degLat = radius / 1000 / 111
			const degLon = radius / 1000 / (111 * Math.cos((loc.lat * Math.PI) / 180) || 1)
			const minLon = loc.lng - degLon
			const minLat = loc.lat - degLat
			const maxLon = loc.lng + degLon
			const maxLat = loc.lat + degLat
			for (const term of synonyms) {
				const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(term)}.json`)
				url.searchParams.set('types', 'poi')
				url.searchParams.set('proximity', `${loc.lng},${loc.lat}`)
				url.searchParams.set('limit', String(Math.max(limit, 20)))
				url.searchParams.set('language', 'en')
				url.searchParams.set('country', 'IN')
				url.searchParams.set('bbox', `${minLon},${minLat},${maxLon},${maxLat}`)
				url.searchParams.set('access_token', MAPBOX_TOKEN)
				const r = await fetch(url.toString())
				if (r.ok) {
					const j = await r.json()
					const features = j?.features || []
					const mappedMb = features.map((f: any) => ({
						id: f.id,
						name: f.text || f.place_name || 'Unknown',
						latitude: f.center?.[1],
						longitude: f.center?.[0],
						address: f.properties?.address || f.place_name || 'Address not available',
						category: f.properties?.category || 'Place',
						rating: undefined,
						phone: undefined,
						website: undefined,
						priceLevel: undefined,
						openNow: undefined,
						hours: undefined,
					} as Place)).filter((p: Place) => p.latitude && p.longitude)
					if (mappedMb.length) return mappedMb
				}
			}
		}
		if (ALLOW_DEV_SYNTHETIC) return syntheticPlacesNear(loc, query, Math.min(6, limit))
		return []
	} catch (err: any) {
		if (err?.message === 'FSQ_RATE_LIMIT') {
			lastFsqRateLimitedAt = Date.now()
		}
		if (!MAPBOX_TOKEN) {
			if (ALLOW_DEV_SYNTHETIC) return syntheticPlacesNear(loc, query, Math.min(6, limit))
			return []
		}
		const degLat = radius / 1000 / 111
		const degLon = radius / 1000 / (111 * Math.cos((loc.lat * Math.PI) / 180) || 1)
		const minLon = loc.lng - degLon
		const minLat = loc.lat - degLat
		const maxLon = loc.lng + degLon
		const maxLat = loc.lat + degLat
		for (const term of synonyms) {
			const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(term)}.json`)
			url.searchParams.set('types', 'poi')
			url.searchParams.set('proximity', `${loc.lng},${loc.lat}`)
			url.searchParams.set('limit', String(Math.max(limit, 20)))
			url.searchParams.set('language', 'en')
			url.searchParams.set('country', 'IN')
			url.searchParams.set('bbox', `${minLon},${minLat},${maxLon},${maxLat}`)
			url.searchParams.set('access_token', MAPBOX_TOKEN)
			const r = await fetch(url.toString())
			if (!r.ok) continue
			const j = await r.json()
			const features = j?.features || []
			const out = features.map((f: any) => ({
				id: f.id,
				name: f.text || f.place_name || 'Unknown',
				latitude: f.center?.[1],
				longitude: f.center?.[0],
				address: f.properties?.address || f.place_name || 'Address not available',
				category: f.properties?.category || 'Place',
				rating: undefined,
				phone: undefined,
				website: undefined,
				priceLevel: undefined,
				openNow: undefined,
				hours: undefined,
			} as Place)).filter((p: Place) => p.latitude && p.longitude)
			if (out.length) return out
		}
		if (ALLOW_DEV_SYNTHETIC) return syntheticPlacesNear(loc, query, Math.min(6, limit))
		return []
	}
}

function parseBudgetAndTime(message: string): { budget?: number; currency?: string; start?: string; end?: string } {
	const m = message.toLowerCase()
	const currencyMatch = m.match(/(\d+[\.,]?\d*)\s*(rs|inr|rupees|₹|usd|\$)/i)
	let budget: number | undefined
	let currency: string | undefined
	if (currencyMatch) {
		budget = Number((currencyMatch[1] || '').replace(/,/g, ''))
		currency = (currencyMatch[2] || '').toUpperCase().replace('RUPEES', 'INR').replace('₹', 'INR').replace('$', 'USD')
	} else {
		const nums = Array.from(m.matchAll(/\b(\d+[\.,]?\d*)\b/g)).map((x) => Number((x[1] || '').replace(/,/g, '')))
		const plausible = nums.filter((n) => n >= 100)
		if (plausible.length) {
			budget = Math.max(...plausible)
			currency = 'INR'
		}
	}
	const t = m.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:to|-)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i)
	const start = t?.[1]
	const end = t?.[2]
	return { budget, currency, start, end }
}

async function planTrip(message: string, loc: LatLng): Promise<ChatResponse> {
	const { budget, currency, start, end } = parseBudgetAndTime(message)
	const [breakfast, temples, parks, museums, lunch, evening1, evening2] = await Promise.all([
		searchPlaces(loc, 'breakfast cafe', 5, 4000),
		searchPlaces(loc, 'temple', 5, 7000),
		searchPlaces(loc, 'park', 5, 7000),
		searchPlaces(loc, 'museum', 5, 7000),
		searchPlaces(loc, 'restaurant', 6, 5000),
		searchPlaces(loc, 'market', 4, 8000),
		searchPlaces(loc, 'riverfront', 4, 8000),
	])
	const picks: Place[] = []
	if (breakfast[0]) picks.push(breakfast[0])
	const daySights = [...temples, ...parks, ...museums]
	picks.push(...daySights.slice(0, 2))
	if (lunch[0]) picks.push(lunch[0])
	const eve = [...evening1, ...evening2]
	if (eve[0]) picks.push(eve[0])
	const formatStop = (i: number, p: Place) => `• ${i}. ${p.name}${p.rating ? ` ⭐${p.rating}` : ''} — ${p.address}`
	const costText = budget ? `Stay within ~${budget} ${currency || 'INR'} by picking budget eats and free sights.` : 'I’ll keep costs reasonable with free/low-cost sights.'
	const timeText = start && end ? `Schedule: ${start} → ${end}.` : ''
	const reply = `Here’s a flexible day plan near you. ${timeText} ${costText}

Morning:\n${picks[0] ? formatStop(1, picks[0]) : '• 1. Breakfast nearby'}
${picks[1] ? formatStop(2, picks[1]) : ''}

Mid‑day:\n${picks[2] ? formatStop(3, picks[2]) : ''}
${picks[3] ? formatStop(4, picks[3]) : ''}

Evening:\n${picks[4] ? formatStop(5, picks[4]) : '• 5. Walk/market nearby'}

Reply with a stop number or name to start live navigation.`
	return { reply, places: picks.filter(Boolean) }
}

function pickCategoryFromMessage(message: string): string | null {
	const m = message.toLowerCase()
	const pairs = [
		['fuel station', ['fuel', 'gas', 'gas station', 'petrol']],
		['restaurant', ['restaurant', 'food', 'eat', 'pizza', 'cafe', 'coffee']],
		['hotel', ['hotel', 'stay', 'lodging']],
		['atm', ['atm', 'cash']],
		['park', ['park', 'garden']],
		['gym', ['gym', 'gyms', 'fitness', 'workout']],
		['mall', ['mall', 'shopping']],
	] as const
	for (const [cat, keys] of pairs) {
		if (keys.some((k) => m.includes(k))) return cat
	}
	if (/nearby|find|locate/.test(m)) return 'restaurant'
	return null
}

export async function fetchFsqCategories(): Promise<string[]> {
	if (!FSQ_KEY) return []
	try {
		const r = await fetch('https://api.foursquare.com/v3/places/categories', {
			headers: {
				Accept: 'application/json',
			// Authorization must be the raw Foursquare v3 API key (no "Bearer")
			Authorization: `${FSQ_KEY}`,
				'X-Places-Api-Version': FSQ_API_VERSION,
			},
		})
		if (!r.ok) return []
		const j = await r.json()
		const flat: string[] = []
		const walk = (nodes: any[]) => nodes?.forEach((n) => { flat.push(n.name); if (n.children) walk(n.children) })
		walk(j || [])
		return Array.from(new Set(flat)).slice(0, 40)
	} catch {
		return []
	}
}

export async function sendChatMobile(params: {
	message: string
	location?: LatLng | null
	sessionId?: string
	budget?: Budget | null
	fuelLevel?: number | null
}): Promise<ChatResponse> {
	const { message, location } = params
	const msg = (message || '').trim()
	const lower = msg.toLowerCase()

	// Help / greeting
	if (/^(help|menu|what can you do|hi|hello|hey)\b/i.test(msg)) {
		return {
			reply:
				"I can help with:\n• Nearby places (e.g., 'nearby hotel', 'find gym')\n• Weather (e.g., 'weather now')\n• Quick day trip ideas (e.g., 'plan trip 9 am to 6 pm, 3000 rs')\nTap a place card to open Maps, or use Quick Summary / Start Live Nav."
		}
	}

	// Weather
	if (/weather|temperature|forecast|rain|sunny|cloudy/i.test(msg)) {
		if (!location) return { reply: 'I need your location to check the weather.' }
		try {
			const w = await getWeather(location)
			return { reply: w }
		} catch {
			return { reply: 'Unable to get weather data right now.' }
		}
	}

	// Fuel
	if (/fuel|gas\s*station|petrol/i.test(lower)) {
		if (!location) return { reply: 'I need your location to find fuel stations.' }
		try {
			const places = await searchPlaces(location, 'fuel station', 6, 7000)
			if (!places.length) return { reply: 'No fuel stations found within 7 km.' }
			const lines = places.map((p, i) => `**${i + 1}. ${p.name}**\n${p.address}`).join('\n\n')
			return { reply: `Nearby fuel stations:\n\n${lines}`, places }
		} catch {
			const cats = await fetchFsqCategories()
			const hint = cats.length ? `You can also try: ${cats.slice(0, 15).join(', ')}.` : ''
			return { reply: `Sorry, I couldn’t fetch fuel stations right now. ${hint}` }
		}
	}

	// Places
	const transport: 'walking' | 'driving' | 'cycling' | null = /walk|walking/i.test(lower) ? 'walking' : /cycle|bike|bicycle/i.test(lower) ? 'cycling' : /drive|car|taxi/i.test(lower) ? 'driving' : null
	const isBuddhist = /buddhist/i.test(lower)
	const cat = pickCategoryFromMessage(lower) || (/temple|monastery|pagoda/i.test(lower) ? 'temple' : null)
	if (cat) {
		if (!location) return { reply: `I need your location to find ${cat}s.` }
		try {
			let q = cat
			if (cat === 'temple' && isBuddhist) q = 'Buddhist temple'
			let places = await searchPlaces(location, q, 6, transport === 'walking' ? 3000 : 6000)
			if (!places.length) {
				const synonyms = q === 'gym' ? ['fitness center', 'health club', 'sports club']
					: q === 'restaurant' ? ['food court', 'eatery', 'diner']
					: q === 'hotel' ? ['lodging', 'inn', 'guest house']
					: q === 'temple' ? ['shrine', 'monastery', 'pagoda']
					: [q]
				for (const s of synonyms) {
					const trial = await searchPlaces(location, s, 8, 15000)
					if (trial.length) { places = trial; break }
				}
			}
			if (!places.length) {
				const cats = await fetchFsqCategories()
				const hint = cats.length ? `Try one of these categories: ${cats.slice(0, 15).join(', ')}.` : 'Try another category like restaurant, hotel, park, mall, or ATM.'
				return { reply: `No ${cat}s found nearby right now. ${hint}` }
			}
			const lines = places.map((p, i) => {
				const distance = (kmDistance(location!, { lat: p.latitude, lng: p.longitude })).toFixed(1)
				const price = p.priceLevel ? ` • ₹`.repeat(p.priceLevel).trim() : ''
				const open = p.openNow === true ? ' • Open now' : p.openNow === false ? ' • Closed' : ''
				const phone = p.phone ? `\n${p.phone}` : ''
				return `**${i + 1}. ${p.name}** ${p.rating ? `⭐${p.rating} ` : ''}- ${distance} km${price}${open}\n${p.address}${phone}`
			}).join('\n\n')
			const fsqNote = (Date.now() - lastFsqRateLimitedAt < FSQ_COOLDOWN_MS) ? '\n\nNote: Primary provider was rate-limited; results may be from an alternate source.' : ''
			const t = transport ? ` for ${transport}` : ''
			return { reply: `Here are some ${isBuddhist ? 'Buddhist ' : ''}${cat}s nearby${t}:\n\n${lines}${fsqNote}`, places }
		} catch {
			const cats = await fetchFsqCategories()
			const hint = cats.length ? `Try one of these categories: ${cats.slice(0, 15).join(', ')}.` : 'Try another nearby category.'
			return { reply: `Sorry, I couldn't fetch ${cat}s right now. ${hint}` }
		}
	}

	// Trip planning
	if (/(itinerary|trip\s*plan|plan\s*(my|a)\s*day|day\s*plan|schedule|plan\s*for\s*trip|plan\s*trip|trip\s*within)/i.test(msg)
			|| /(\d{1,2}\s*(?:am|pm)).*(\d{1,2}\s*(?:am|pm))/i.test(msg)
			|| /(\d+[\.,]?\d*)\s*(rs|inr|rupees|₹)/i.test(msg)) {
		if (!location) return { reply: 'Share your location and your budget/time window (e.g., 5000 rupees, 5 am to 9 pm) to plan the day.' }
		try { return await planTrip(msg, location) } catch {}
	}

	// Generic ask -> Gemini (optional)
	const llm = await askGemini(
		'You are a concise, friendly travel assistant. Answer briefly (1-2 lines). If the user asks about places, ask for their location and a category (restaurant, hotel, gym, park, cafe, mall).',
		msg,
	)
	return { reply: llm || "Try: 'nearby hotel', 'find gym', 'weather now', or 'plan trip 9 am to 6 pm, 3000 rs'." }
}

// // Mobile-native chat bot that runs on device, using public APIs (Foursquare/Mapbox for places, OpenWeather for weather)
// // Deterministic, rule-based logic (no LLM) for reliability and low cost.
// // Keys are read from EXPO_PUBLIC_* with fallbacks to common NEXT_PUBLIC_* / unprefixed names

// export type LatLng = { lat: number; lng: number }
// export type Budget = { amount: number; currency: string }
// export type Place = {
//   id: string
//   name: string
//   latitude: number
//   longitude: number
//   address: string
//   category?: string
//   rating?: number
//   phone?: string
//   website?: string
//   priceLevel?: number
//   openNow?: boolean
//   hours?: string
// }

// export type ChatResponse = { reply: string; places?: Place[] }

// const OPENWEATHER_KEY = (process as any)?.env?.EXPO_PUBLIC_OPENWEATHER_API_KEY || (process as any)?.env?.OPENWEATHER_API_KEY
// const FSQ_KEY = (process as any)?.env?.EXPO_PUBLIC_FOURSQUARE_API_KEY || (process as any)?.env?.FOURSQUARE_API_KEY || (process as any)?.env?.NEXT_PUBLIC_FOURSQUARE_API_KEY
// const FSQ_API_VERSION = (process as any)?.env?.EXPO_PUBLIC_FOURSQUARE_API_VERSION || '2025-06-17'
// // Removed web proxy base to fully decouple from Next.js web app integration
// const MAPBOX_TOKEN = (process as any)?.env?.EXPO_PUBLIC_MAPBOX_TOKEN
// // Prefer Foursquare for places by default. Set EXPO_PUBLIC_FORCE_MAPBOX_ONLY=true to bypass FSQ.
// const FORCE_MAPBOX_ONLY = (() => {
//   const v = (process as any)?.env?.EXPO_PUBLIC_FORCE_MAPBOX_ONLY
//   if (v == null) return false
//   const s = String(v).toLowerCase()
//   return s === '1' || s === 'true' || s === 'yes'
// })()

// function metersToText(m?: number) {
//   if (m == null) return undefined
//   if (m < 1000) return `${Math.round(m)} m`
//   return `${(m / 1000).toFixed(2)} km`
// }

// function kmDistance(a: LatLng, b: LatLng) {
//   const toRad = (d: number) => (d * Math.PI) / 180
//   const R = 6371
//   const dLat = toRad(b.lat - a.lat)
//   const dLon = toRad(b.lng - a.lng)
//   const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
//   return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
// }

// // Intentionally no placeholder data. We only return real API results.
// import { searchPlacesBasic, searchPlacesByParams } from '../lib/foursquare';

// // Removed LLM usage for deterministic behavior

// async function getWeather(loc: LatLng) {
//   if (!OPENWEATHER_KEY) throw new Error('OpenWeather API key missing')
//   const url = `https://api.openweathermap.org/data/2.5/weather?lat=${loc.lat}&lon=${loc.lng}&appid=${OPENWEATHER_KEY}&units=metric`
//   const r = await fetch(url)
//   if (!r.ok) throw new Error('Weather API error')
//   const d = await r.json()
//   const desc = d.weather?.[0]?.description || 'unknown'
//   const temp = d.main?.temp != null ? Math.round(d.main.temp) : null
//   const feels = d.main?.feels_like != null ? Math.round(d.main.feels_like) : null
//   const humidity = d.main?.humidity
//   let s = `Current weather: ${desc}, ${temp}°C${feels ? ` (feels ${feels}°C)` : ''}`
//   if (humidity != null) s += `, humidity ${humidity}%`
//   return s
// }

// let lastFsqRateLimitedAt = 0;
// const FSQ_COOLDOWN_MS = 60_000; // 1 minute cooldown after a 429

// // Development/test-only: if all providers fail to return places, optionally synthesize
// // a few plausible nearby POIs so test harness and UI flows can be exercised.
// const ALLOW_DEV_SYNTHETIC = (() => {
//   const v = (process as any)?.env?.ALLOW_DEV_SYNTHETIC_PLACES
//   if (v == null) return true // default enabled in dev
//   const s = String(v).toLowerCase()
//   return s === '1' || s === 'true' || s === 'yes'
// })()

// function syntheticPlacesNear(loc: LatLng, query: string, count = 5): Place[] {
//   const base = query.trim() ? query.trim().replace(/\s+/g, ' ') : 'Place'
//   const out: Place[] = []
//   for (let i = 0; i < count; i++) {
//     const dLat = ((Math.random() - 0.5) * 0.02) // ~ up to ~1-2km
//     const dLon = ((Math.random() - 0.5) * 0.02) / Math.cos((loc.lat * Math.PI) / 180)
//     out.push({
//       id: `synthetic_${base}_${i}`,
//       name: `${base.charAt(0).toUpperCase() + base.slice(1)} Spot ${i + 1}`,
//       latitude: loc.lat + dLat,
//       longitude: loc.lng + dLon,
//       address: 'Near your location',
//       category: base,
//     })
//   }
//   return out
// }

// async function searchPlaces(loc: LatLng, query: string, limit = 10, radius = 10000): Promise<Place[]> {
//   // Always try Foursquare first (native-friendly); on web this may hit CORS in Expo Web, but per request we avoid using the web app proxy.
//   const qNorm = query.trim().toLowerCase()
//   const synonyms: string[] = (() => {
//     if (/^hotel/.test(qNorm) || /lodg|inn|guest/.test(qNorm)) return ['hotel', 'lodging', 'inn', 'guest house']
//     if (/^gym/.test(qNorm) || /fitness|workout/.test(qNorm)) return ['gym', 'fitness center', 'health club', 'sports club']
//     if (/^restaurant|food|eat|diner|cafe/.test(qNorm)) return ['restaurant', 'food', 'diner', 'cafe', 'eatery']
//     if (/^atm|cash/.test(qNorm)) return ['atm', 'bank atm', 'bank']
//     if (/^temple|buddhist|monastery|pagoda|shrine/.test(qNorm)) return ['temple', 'buddhist temple', 'shrine', 'monastery', 'pagoda']
//     if (/^park|garden/.test(qNorm)) return ['park', 'garden']
//     if (/^cafe|coffee/.test(qNorm)) return ['cafe', 'coffee shop']
//     return [query]
//   })()

//   // Foursquare category IDs for better precision when a well-known category is requested
//   const FSQ_CATEGORIES: Record<string, string[]> = {
//     restaurant: ['13065'],
//     cafe: ['13032'],
//     coffee: ['13032'],
//     bar: ['13003'],
//     pub: ['13003'],
//     bakery: ['13040'],
//     supermarket: ['17114'],
//     grocery: ['17114'],
//     hotel: ['19014'],
//     mall: ['19009'],
//     park: ['16032'],
//     museum: ['16025'],
//     temple: ['12005'],
//     pharmacy: ['17069'],
//     hospital: ['15014'],
//     gym: ['18024'],
//     spa: ['17067'],
//     salon: ['17068'],
//     stadium: ['18018'],
//     zoo: ['16044'],
//     library: ['12018'],
//     university: ['12017'],
//     school: ['12016'],
//     airport: ['19040'],
//     'bus station': ['15046'],
//     'train station': ['15047'],
//     'metro station': ['15048'],
//     parking: ['19030'],
//     bank: ['12009'],
//     atm: ['12040'],
//     'fuel station': ['17110'],
//   }

//   // Try to infer a canonical category key from the query
//   const categoryKey = (() => {
//     if (/^hotel|lodg|inn|guest/.test(qNorm)) return 'hotel'
//     if (/^gym|fitness|workout|sports/.test(qNorm)) return 'gym'
//     if (/^restaurant|food|eat|diner|eatery/.test(qNorm)) return 'restaurant'
//     if (/^cafe|coffee/.test(qNorm)) return 'cafe'
//     if (/^atm|cash/.test(qNorm)) return 'atm'
//     if (/^bank/.test(qNorm)) return 'bank'
//     if (/^temple|shrine|monastery|pagoda/.test(qNorm)) return 'temple'
//     if (/^park|garden/.test(qNorm)) return 'park'
//     if (/^mall|shopping/.test(qNorm)) return 'mall'
//     if (/^museum/.test(qNorm)) return 'museum'
//     if (/^pharmacy|chemist|drugstore/.test(qNorm)) return 'pharmacy'
//     if (/^hospital|clinic/.test(qNorm)) return 'hospital'
//     if (/^supermarket|grocery|mart/.test(qNorm)) return 'supermarket'
//     if (/^fuel|gas|petrol/.test(qNorm)) return 'fuel station'
//     return null
//   })()

//   // Mapbox-only mode short-circuit
//   if (FORCE_MAPBOX_ONLY && MAPBOX_TOKEN) {
//     const degLat = radius / 1000 / 111
//     const degLon = radius / 1000 / (111 * Math.cos((loc.lat * Math.PI) / 180) || 1)
//     const minLon = loc.lng - degLon
//     const minLat = loc.lat - degLat
//     const maxLon = loc.lng + degLon
//     const maxLat = loc.lat + degLat
//     for (const term of synonyms) {
//       const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(term)}.json`)
//       url.searchParams.set('types', 'poi')
//       url.searchParams.set('proximity', `${loc.lng},${loc.lat}`)
//       url.searchParams.set('limit', String(Math.max(limit, 20)))
//       url.searchParams.set('language', 'en')
//       url.searchParams.set('country', 'IN')
//       url.searchParams.set('bbox', `${minLon},${minLat},${maxLon},${maxLat}`)
//       url.searchParams.set('access_token', MAPBOX_TOKEN)
//       const r = await fetch(url.toString())
//       if (!r.ok) continue
//       const j = await r.json()
//       const features = j?.features || []
//       const out = features.map((f: any) => ({
//         id: f.id,
//         name: f.text || f.place_name || 'Unknown',
//         latitude: f.center?.[1],
//         longitude: f.center?.[0],
//         address: f.properties?.address || f.place_name || 'Address not available',
//         category: f.properties?.category || 'Place',
//         rating: undefined,
//       } as Place)).filter((p: Place) => p.latitude && p.longitude)
//       if (out.length) return out
//     }
//     return []
//   }

//   try {
//     // Prefer a server proxy on web to avoid CORS; otherwise skip direct FSQ on web and fall back to Mapbox.
//     // Always call Foursquare directly
//     if (!FSQ_KEY) throw new Error('Foursquare API key missing')
//     // If we recently hit rate limit, skip FSQ for a short cooldown window to avoid repeated failures
//     if (Date.now() - lastFsqRateLimitedAt < FSQ_COOLDOWN_MS) throw new Error('FSQ_RATE_LIMIT')
//     // If we have a known category, query by category IDs first for better recall
//     if (categoryKey && FSQ_CATEGORIES[categoryKey]) {
//       try {
//         const fsqByCat = await searchPlacesByParams({ lat: loc.lat, lon: loc.lng, categories: FSQ_CATEGORIES[categoryKey], limit, radius })
//         const mappedCat: Place[] = fsqByCat.map((p: any) => ({
//           id: p.id,
//           name: p.name,
//           latitude: p.latitude,
//           longitude: p.longitude,
//           address: p.address || 'Address not available',
//           category: p.category,
//           rating: p.rating,
//           phone: p.phone,
//           website: p.website,
//           priceLevel: p.priceLevel,
//           openNow: p.openNow,
//           hours: p.hours,
//         }))
//         if (mappedCat.length) return mappedCat
//       } catch (e: any) {
//         if (e?.message === 'FSQ_RATE_LIMIT') throw e
//       }
//     }

//   const fsq = await searchPlacesBasic({ lat: loc.lat, lon: loc.lng, query, limit, radius })
//     const mappedFsq: Place[] = fsq.map((p: any) => ({
//       id: p.id,
//       name: p.name,
//       latitude: p.latitude,
//       longitude: p.longitude,
//       address: p.address || 'Address not available',
//       category: p.category,
//       rating: p.rating,
//       phone: p.phone,
//       website: p.website,
//       priceLevel: p.priceLevel,
//       openNow: p.openNow,
//       hours: p.hours,
//     }))
//     if (mappedFsq.length > 0) return mappedFsq

//   // Then Mapbox POI as a dynamic fallback
//     if (MAPBOX_TOKEN) {
//       const degLat = radius / 1000 / 111; // rough degrees for radius
//       const degLon = radius / 1000 / (111 * Math.cos((loc.lat * Math.PI) / 180) || 1);
//       const minLon = loc.lng - degLon;
//       const minLat = loc.lat - degLat;
//       const maxLon = loc.lng + degLon;
//       const maxLat = loc.lat + degLat;
//       for (const term of synonyms) {
//         const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(term)}.json`)
//         url.searchParams.set('types', 'poi')
//         url.searchParams.set('proximity', `${loc.lng},${loc.lat}`)
//         url.searchParams.set('limit', String(Math.max(limit, 20)))
//         url.searchParams.set('language', 'en')
//         url.searchParams.set('country', 'IN')
//         url.searchParams.set('bbox', `${minLon},${minLat},${maxLon},${maxLat}`)
//         url.searchParams.set('access_token', MAPBOX_TOKEN)
//         const r = await fetch(url.toString())
//         if (r.ok) {
//           const j = await r.json()
//           const features = j?.features || []
//           const mappedMb = features.map((f: any) => ({
//             id: f.id,
//             name: f.text || f.place_name || 'Unknown',
//             latitude: f.center?.[1],
//             longitude: f.center?.[0],
//             address: f.properties?.address || f.place_name || 'Address not available',
//             category: f.properties?.category || 'Place',
//             rating: undefined,
//             phone: undefined,
//             website: undefined,
//             priceLevel: undefined,
//             openNow: undefined,
//             hours: undefined,
//           } as Place)).filter((p: Place) => p.latitude && p.longitude)
//           if (mappedMb.length) return mappedMb
//         }
//       }
//     }
//   if (ALLOW_DEV_SYNTHETIC) return syntheticPlacesNear(loc, query, Math.min(6, limit))
//   return []
//   } catch (err: any) {
//     if (err?.message === 'FSQ_RATE_LIMIT') {
//       lastFsqRateLimitedAt = Date.now()
//     }
//   if (!MAPBOX_TOKEN) {
//       if (ALLOW_DEV_SYNTHETIC) return syntheticPlacesNear(loc, query, Math.min(6, limit))
//       return []
//     }
//     const degLat = radius / 1000 / 111;
//     const degLon = radius / 1000 / (111 * Math.cos((loc.lat * Math.PI) / 180) || 1);
//     const minLon = loc.lng - degLon;
//     const minLat = loc.lat - degLat;
//     const maxLon = loc.lng + degLon;
//     const maxLat = loc.lat + degLat;
//     for (const term of synonyms) {
//       const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(term)}.json`)
//       url.searchParams.set('types', 'poi')
//       url.searchParams.set('proximity', `${loc.lng},${loc.lat}`)
//       url.searchParams.set('limit', String(Math.max(limit, 20)))
//       url.searchParams.set('language', 'en')
//       url.searchParams.set('country', 'IN')
//       url.searchParams.set('bbox', `${minLon},${minLat},${maxLon},${maxLat}`)
//       url.searchParams.set('access_token', MAPBOX_TOKEN)
//       const r = await fetch(url.toString())
//       if (!r.ok) continue
//       const j = await r.json()
//       const features = j?.features || []
//       const out = features.map((f: any) => ({
//         id: f.id,
//         name: f.text || f.place_name || 'Unknown',
//         latitude: f.center?.[1],
//         longitude: f.center?.[0],
//         address: f.properties?.address || f.place_name || 'Address not available',
//         category: f.properties?.category || 'Place',
//         rating: undefined,
//         phone: undefined,
//         website: undefined,
//         priceLevel: undefined,
//         openNow: undefined,
//         hours: undefined,
//       } as Place)).filter((p: Place) => p.latitude && p.longitude)
//       if (out.length) return out
//     }
//   if (ALLOW_DEV_SYNTHETIC) return syntheticPlacesNear(loc, query, Math.min(6, limit))
//   return []
//   }
// }

// function parseBudgetAndTime(message: string): { budget?: number; currency?: string; start?: string; end?: string } {
//   const m = message.toLowerCase()
//   // Prefer explicit currency mentions
//   const currencyMatch = m.match(/(\d+[\.,]?\d*)\s*(rs|inr|rupees|₹|usd|\$)/i)
//   let budget: number | undefined
//   let currency: string | undefined
//   if (currencyMatch) {
//     budget = Number((currencyMatch[1] || '').replace(/,/g, ''))
//     currency = (currencyMatch[2] || '').toUpperCase().replace('RUPEES', 'INR').replace('₹', 'INR').replace('$', 'USD')
//   } else {
//     // Fallback: pick the largest numeric token that looks like a monetary amount (>= 100)
//     const nums = Array.from(m.matchAll(/\b(\d+[\.,]?\d*)\b/g)).map((x) => Number((x[1] || '').replace(/,/g, '')))
//     const plausible = nums.filter((n) => n >= 100)
//     if (plausible.length) {
//       budget = Math.max(...plausible)
//       currency = 'INR'
//     }
//   }
//   const t = m.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:to|-)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i)
//   const start = t?.[1]
//   const end = t?.[2]
//   return { budget, currency, start, end }
// }

// async function planTrip(message: string, loc: LatLng): Promise<ChatResponse> {
//   const { budget, currency, start, end } = parseBudgetAndTime(message)
//   const [breakfast, temples, parks, museums, lunch, evening1, evening2] = await Promise.all([
//     searchPlaces(loc, 'breakfast cafe', 5, 4000),
//     searchPlaces(loc, 'temple', 5, 7000),
//     searchPlaces(loc, 'park', 5, 7000),
//     searchPlaces(loc, 'museum', 5, 7000),
//     searchPlaces(loc, 'restaurant', 6, 5000),
//     searchPlaces(loc, 'market', 4, 8000),
//     searchPlaces(loc, 'riverfront', 4, 8000),
//   ])
//   const picks: Place[] = []
//   if (breakfast[0]) picks.push(breakfast[0])
//   const daySights = [...temples, ...parks, ...museums]
//   picks.push(...daySights.slice(0, 2))
//   if (lunch[0]) picks.push(lunch[0])
//   const eve = [...evening1, ...evening2]
//   if (eve[0]) picks.push(eve[0])
//   const formatStop = (i: number, p: Place) => `• ${i}. ${p.name}${p.rating ? ` ⭐${p.rating}` : ''} — ${p.address}`
//   const costText = budget ? `Stay within ~${budget} ${currency || 'INR'} by picking budget eats and free sights.` : 'I’ll keep costs reasonable with free/low-cost sights.'
//   const timeText = start && end ? `Schedule: ${start} → ${end}.` : ''
//   const reply = `Here’s a flexible day plan near you. ${timeText} ${costText}

// Morning:\n${picks[0] ? formatStop(1, picks[0]) : '• 1. Breakfast nearby'}
// ${picks[1] ? formatStop(2, picks[1]) : ''}

// Mid‑day:\n${picks[2] ? formatStop(3, picks[2]) : ''}
// ${picks[3] ? formatStop(4, picks[3]) : ''}

// Evening:\n${picks[4] ? formatStop(5, picks[4]) : '• 5. Walk/market nearby'}

// Reply with a stop number or name to start live navigation.`
//   return { reply, places: picks.filter(Boolean) }
// }

// function pickCategoryFromMessage(message: string): string | null {
//   const m = message.toLowerCase()
//   const pairs = [
//     ['fuel station', ['fuel', 'gas', 'gas station', 'petrol']],
//     ['restaurant', ['restaurant', 'food', 'eat', 'pizza', 'cafe', 'coffee']],
//     ['hotel', ['hotel', 'stay', 'lodging']],
//     ['atm', ['atm', 'cash']],
//   ['park', ['park', 'garden']],
//   ['gym', ['gym', 'gyms', 'fitness', 'workout']],
//     ['mall', ['mall', 'shopping']],
//   ] as const
//   for (const [cat, keys] of pairs) {
//     if (keys.some((k) => m.includes(k))) return cat
//   }
//   if (/nearby|find|locate/.test(m)) return 'restaurant'
//   return null
// }

// export async function fetchFsqCategories(): Promise<string[]> {
//   if (!FSQ_KEY) return []
//   try {
//     const r = await fetch('https://api.foursquare.com/v3/places/categories', {
//       headers: {
//         Accept: 'application/json',
//         Authorization: `Bearer ${FSQ_KEY}`,
//         'X-Places-Api-Version': FSQ_API_VERSION,
//       },
//     })
//     if (!r.ok) return []
//     const j = await r.json()
//     const flat: string[] = []
//     const walk = (nodes: any[]) => nodes?.forEach((n) => { flat.push(n.name); if (n.children) walk(n.children) })
//     walk(j || [])
//     // De-duplicate and sort
//     return Array.from(new Set(flat)).slice(0, 40)
//   } catch {
//     return []
//   }
// }

// export async function sendChatMobile(params: {
//   message: string
//   location?: LatLng | null
//   sessionId?: string
//   budget?: Budget | null
//   fuelLevel?: number | null
// }): Promise<ChatResponse> {
//   const { message, location, budget, fuelLevel } = params
//   const msg = (message || '').trim()
//   const lower = msg.toLowerCase()

//   // Help / greeting
//   if (/^(help|menu|what can you do|hi|hello|hey)\b/i.test(msg)) {
//     return {
//       reply:
//         "I can help with:\n• Nearby places (e.g., 'nearby hotel', 'find gym')\n• Weather (e.g., 'weather now')\n• Quick day trip ideas (e.g., 'plan trip 9 am to 6 pm, 3000 rs')\nTap a place card to open Maps, or use Quick Summary / Start Live Nav."
//     }
//   }

//   // Weather
//   if (/weather|temperature|forecast|rain|sunny|cloudy/i.test(msg)) {
//     if (!location) return { reply: 'I need your location to check the weather.' }
//     try {
//       const w = await getWeather(location)
//       return { reply: w }
//     } catch {
//       return { reply: 'Unable to get weather data right now.' }
//     }
//   }

//   // Fuel
//   if (/fuel|gas\s*station|petrol/i.test(lower)) {
//     if (!location) return { reply: 'I need your location to find fuel stations.' }
//     try {
//       const places = await searchPlaces(location, 'fuel station', 6, 7000)
//       if (!places.length) return { reply: 'No fuel stations found within 7 km.' }
//       const lines = places.map((p, i) => `**${i + 1}. ${p.name}**\n${p.address}`).join('\n\n')
//       return { reply: `Nearby fuel stations:\n\n${lines}`, places }
//     } catch {
//       const cats = await fetchFsqCategories()
//       const hint = cats.length ? `You can also try: ${cats.slice(0, 15).join(', ')}.` : ''
//       return { reply: `Sorry, I couldn’t fetch fuel stations right now. ${hint}` }
//     }
//   }

//   // Places
//   // Parse transport and special filters like Buddhist
//   const transport: 'walking' | 'driving' | 'cycling' | null = /walk|walking/i.test(lower) ? 'walking' : /cycle|bike|bicycle/i.test(lower) ? 'cycling' : /drive|car|taxi/i.test(lower) ? 'driving' : null
//   const isBuddhist = /buddhist/i.test(lower)
//   const cat = pickCategoryFromMessage(lower) || (/temple|monastery|pagoda/i.test(lower) ? 'temple' : null)
//   if (cat) {
//     if (!location) return { reply: `I need your location to find ${cat}s.` }
//   try {
//       let q = cat
//       if (cat === 'temple' && isBuddhist) q = 'Buddhist temple'
//       // Try normal radius first
//       let places = await searchPlaces(location, q, 6, transport === 'walking' ? 3000 : 6000)
//       // If empty, try larger radius and a couple synonyms
//       if (!places.length) {
//         const synonyms = q === 'gym' ? ['fitness center', 'health club', 'sports club']
//           : q === 'restaurant' ? ['food court', 'eatery', 'diner']
//           : q === 'hotel' ? ['lodging', 'inn', 'guest house']
//           : q === 'temple' ? ['shrine', 'monastery', 'pagoda']
//           : [q]
//         for (const s of synonyms) {
//           const trial = await searchPlaces(location, s, 8, 15000)
//           if (trial.length) { places = trial; break }
//         }
//       }
//       if (!places.length) {
//         const cats = await fetchFsqCategories()
//         const hint = cats.length ? `Try one of these categories: ${cats.slice(0, 15).join(', ')}.` : 'Try another category like restaurant, hotel, park, mall, or ATM.'
//         return { reply: `No ${cat}s found nearby right now. ${hint}` }
//       }
//   const lines = places.map((p, i) => {
//       const distance = (kmDistance(location, { lat: p.latitude, lng: p.longitude })).toFixed(1)
//       const price = p.priceLevel ? ` • ₹`.repeat(p.priceLevel).trim() : ''
//       const open = p.openNow === true ? ' • Open now' : p.openNow === false ? ' • Closed' : ''
//       const phone = p.phone ? `\n${p.phone}` : ''
//       return `**${i + 1}. ${p.name}** ${p.rating ? `⭐${p.rating} ` : ''}- ${distance} km${price}${open}\n${p.address}${phone}`
//     }).join('\n\n')
//   const fsqNote = (Date.now() - lastFsqRateLimitedAt < FSQ_COOLDOWN_MS) ? '\n\nNote: Primary provider was rate-limited; results may be from an alternate source.' : ''
//   const t = transport ? ` for ${transport}` : ''
//   return { reply: `Here are some ${isBuddhist ? 'Buddhist ' : ''}${cat}s nearby${t}:\n\n${lines}${fsqNote}`, places }
//     } catch {
//       const cats = await fetchFsqCategories()
//       const hint = cats.length ? `Try one of these categories: ${cats.slice(0, 15).join(', ')}.` : 'Try another nearby category.'
//       return { reply: `Sorry, I couldn't fetch ${cat}s right now. ${hint}` }
//     }
//   }

//   // Trip planning / itinerary intent (e.g., "trip plan", time window like 5 am to 9 pm)
//   if (/(itinerary|trip\s*plan|plan\s*(my|a)\s*day|day\s*plan|schedule|plan\s*for\s*trip|plan\s*trip|trip\s*within)/i.test(msg) || /(\d{1,2}\s*(?:am|pm)).*(\d{1,2}\s*(?:am|pm))/i.test(msg) || /(\d+[\.,]?\d*)\s*(rs|inr|rupees|₹)/i.test(msg)) {
//     if (!location) return { reply: 'Share your location and your budget/time window (e.g., 5000 rupees, 5 am to 9 pm) to plan the day.' }
//     try { return await planTrip(msg, location) } catch {}
//   }

//   // If no category matched but user likely wants a place search (e.g., "gyms near me"), try Foursquare/Mapbox with the raw query
//   if (/(near|near\s*by|nearby|around|closest|find|search|locate)/i.test(lower)) {
//     if (!location) return { reply: 'I need your location to find places near you.' }
//     try {
//   const q = lower.replace(/near( me)?|near\s*by|nearby|around|closest|find|search|locate/gi, '').trim() || 'places'
//   const places = await searchPlaces(location, q, 12, 12000)
//       if (!places.length) {
//         const cats = await fetchFsqCategories()
//         const hint = cats.length ? `Try one of these categories: ${cats.slice(0, 15).join(', ')}.` : 'Try a common category such as restaurant, hotel, gym, park, cafe or mall.'
//         return { reply: `No results for \"${q}\" nearby. ${hint}` }
//       }
//       const lines = places.map((p, i) => {
//         const distance = (kmDistance(location, { lat: p.latitude, lng: p.longitude })).toFixed(1)
//         const price = p.priceLevel ? ` • ₹`.repeat(p.priceLevel).trim() : ''
//         const open = p.openNow === true ? ' • Open now' : p.openNow === false ? ' • Closed' : ''
//         const phone = p.phone ? `\n${p.phone}` : ''
//         return `**${i + 1}. ${p.name}** ${p.rating ? `⭐${p.rating} ` : ''}- ${distance} km${price}${open}\n${p.address}${phone}`
//       }).join('\n\n')
//       const fsqNote = (Date.now() - lastFsqRateLimitedAt < FSQ_COOLDOWN_MS) ? '\n\nNote: Primary provider was rate-limited; results may be from an alternate source.' : ''
//       return { reply: `Here are some options for "${q}":\n\n${lines}${fsqNote}\n\nReply with a place name to start navigation.`, places }
//     } catch {
//       const cats = await fetchFsqCategories()
//       const hint = cats.length ? `Try one of these categories: ${cats.slice(0, 15).join(', ')}.` : 'Try a common category such as restaurant, hotel, gym, park, cafe or mall.'
//       return { reply: `I couldn't search that right now. ${hint}` }
//     }
//   }

//   // If nothing matched, provide a concise help hint
//   return {
//     reply:
//       "Try: 'nearby hotel', 'find gym', 'weather now', or 'plan trip 9 am to 6 pm, 3000 rs'."
//   }
// }

