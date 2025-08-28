
import type { Place } from '../lib/types';
// Mobile-native chatbot: Foursquare for places, OpenWeather for weather, optional Gemini for open-ended replies.
import { fetchPlaces } from '../lib/foursquare';
// Deterministic logic for places; Gemini only used as a last resort for general Q&A.

async function planTrip(message: string, loc: LatLng): Promise<ChatResponse> {
    const { budget, currency, start, end } = parseBudgetAndTime(message)
    const [breakfast, temples, parks, museums, lunch, evening1, evening2] = await Promise.all([
        fetchPlaces({ lat: loc.lat, lon: loc.lng, query: 'breakfast cafe', limit: 5, radius: 4000 }),
        fetchPlaces({ lat: loc.lat, lon: loc.lng, query: 'temple', limit: 5, radius: 7000 }),
        fetchPlaces({ lat: loc.lat, lon: loc.lng, query: 'park', limit: 5, radius: 7000 }),
        fetchPlaces({ lat: loc.lat, lon: loc.lng, query: 'museum', limit: 5, radius: 7000 }),
        fetchPlaces({ lat: loc.lat, lon: loc.lng, query: 'restaurant', limit: 6, radius: 5000 }),
        fetchPlaces({ lat: loc.lat, lon: loc.lng, query: 'market', limit: 4, radius: 8000 }),
        fetchPlaces({ lat: loc.lat, lon: loc.lng, query: 'riverfront', limit: 4, radius: 8000 })
    ]);
    const breakfastM = breakfast;
    const templesM = temples;
    const parksM = parks;
    const museumsM = museums;
    const lunchM = lunch;
    const evening1M = evening1;
    const evening2M = evening2;
    const picks: Place[] = []
    if (breakfastM[0]) picks.push(breakfastM[0])
    const daySights = [...templesM, ...parksM, ...museumsM]
    picks.push(...daySights.slice(0, 2))
    if (lunchM[0]) picks.push(lunchM[0])
    const eve = [...evening1M, ...evening2M]
    if (eve[0]) picks.push(eve[0])
    const formatStop = (i: number, p: Place) => `• ${i}. ${p.name}${p.rating ? ` ⭐${p.rating}` : ''} — ${p.location?.formatted_address || 'Address not available'}`
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
    if (!FSQ_KEY) return [];
    try {
        const r = await fetch('https://api.foursquare.com/v3/places/categories', {
            headers: {
                Accept: 'application/json',
                Authorization: `${FSQ_KEY}`,
                'X-Places-Api-Version': FSQ_API_VERSION,
            },
        });
        if (!r.ok) return [];
        const j = await r.json();
        const flat: string[] = [];
        const walk = (nodes: any[]) => nodes?.forEach((n) => { flat.push(n.name); if (n.children) walk(n.children); });
        walk(j || []);
        return Array.from(new Set(flat)).slice(0, 40);
    } catch {
        return [];
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
            const places = await fetchPlaces({ lat: location.lat, lon: location.lng, query: 'fuel station', limit: 6, radius: 7000 })
            if (!places.length) return { reply: 'No fuel stations found within 7 km.' }
            const lines = places.map((p, i) => `**${i + 1}. ${p.name}**\n${p.location?.formatted_address || 'Address not available'}`).join('\n\n')
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
            let places = await fetchPlaces({ lat: location.lat, lon: location.lng, query: q, limit: 6, radius: transport === 'walking' ? 3000 : 6000 })
            if (!places.length) {
                const synonyms = q === 'gym' ? ['fitness center', 'health club', 'sports club']
                    : q === 'restaurant' ? ['food court', 'eatery', 'diner']
                    : q === 'hotel' ? ['lodging', 'inn', 'guest house']
                    : q === 'temple' ? ['shrine', 'monastery', 'pagoda']
                    : [q]
                for (const s of synonyms) {
                    const trial = await fetchPlaces({ lat: location.lat, lon: location.lng, query: s, limit: 8, radius: 15000 })
                    if (trial.length) { places = trial; break }
                }
            }
            if (!places.length) {
                const cats = await fetchFsqCategories()
                const hint = cats.length ? `Try one of these categories: ${cats.slice(0, 15).join(', ')}.` : 'Try another category like restaurant, hotel, park, mall, or ATM.'
                return { reply: `No ${cat}s found nearby right now. ${hint}` }
            }
            const lines = places.map((p, i) => {
                const lat = p.geocodes?.main?.lat;
                const lng = p.geocodes?.main?.lng;
                const distance = (lat && lng) ? (kmDistance(location!, { lat, lng })).toFixed(1) : '?';
                const price = p.price ? ` • ₹`.repeat(p.price).trim() : '';
                // openNow and phone are not in Place type, so skip
                return `**${i + 1}. ${p.name}** ${p.rating ? `⭐${p.rating} ` : ''}- ${distance} km${price}\n${p.location?.formatted_address || 'Address not available'}`
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
        // Use wallet/account info for budget if available
        let budgetText = '';
        try {
            const { useFinanceStore } = await import('@/services/financeService');
            const accounts = useFinanceStore.getState().accounts;
            if (accounts && accounts.length > 0) {
                const netWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0);
                budgetText = `\n\nYour wallet net worth: ₹${netWorth.toLocaleString()}`;
            }
        } catch {}
        try {
            const tripPlanReply = await planTrip(msg, location);
            // Add a button for trip planner map
            return {
                ...tripPlanReply,
                reply: tripPlanReply.reply + budgetText +
                  "\n\n[Open Trip Planner Map](app/(tabs)/trip-planner)"
            };
        } catch {}
    }

    // Generic ask -> Gemini (optional)
    // const llm = await askGemini(
    //     'You are a concise, friendly travel assistant. Answer briefly (1-2 lines). If the user asks about places, ask for their location and a category (restaurant, hotel, gym, park, cafe, mall).',
    //     msg,
    // )
    return { reply: "Try: 'nearby hotel', 'find gym', 'weather now', or 'plan trip 9 am to 6 pm, 3000 rs'." }
}

// // Mobile-native chat bot that runs on device, using public APIs (Foursquare/Mapbox for places, OpenWeather for weather)
// // Deterministic, rule-based logic (no LLM) for reliability and low cost.
// // Keys are read from EXPO_PUBLIC_* with fallbacks to common NEXT_PUBLIC_* / unprefixed names

export type LatLng = { lat: number; lng: number }
export type Budget = { amount: number; currency: string }
// Use Place from src/lib/types

export type ChatResponse = { reply: string; places?: Place[] }

const OPENWEATHER_KEY = (process as any)?.env?.EXPO_PUBLIC_OPENWEATHER_API_KEY || (process as any)?.env?.OPENWEATHER_API_KEY
const FSQ_KEY = (process as any)?.env?.EXPO_PUBLIC_FOURSQUARE_API_KEY || (process as any)?.env?.FOURSQUARE_API_KEY || (process as any)?.env?.NEXT_PUBLIC_FOURSQUARE_API_KEY
const FSQ_API_VERSION = (process as any)?.env?.EXPO_PUBLIC_FOURSQUARE_API_VERSION || '2025-06-17'
// Removed web proxy base to fully decouple from Next.js web app integration
const MAPBOX_TOKEN = (process as any)?.env?.EXPO_PUBLIC_MAPBOX_TOKEN
// Prefer Foursquare for places by default. Set EXPO_PUBLIC_FORCE_MAPBOX_ONLY=true to bypass FSQ.
const FORCE_MAPBOX_ONLY = (() => {
    const v = (process as any)?.env?.EXPO_PUBLIC_FORCE_MAPBOX_ONLY
    if (v == null) return false
    const s = String(v).toLowerCase()
    return s === '1' || s === 'true' || s === 'yes'
})()

function metersToText(m?: number) {
    if (m == null) return undefined
    if (m < 1000) return `${Math.round(m)} m`
    return `${(m / 1000).toFixed(2)} km`
}

function kmDistance(a: LatLng, b: LatLng) {
    const toRad = (d: number) => (d * Math.PI) / 180
    const R = 6371
    const dLat = toRad(b.lat - a.lat)
    const dLon = toRad(b.lng - a.lng)
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
    return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

// import { searchPlacesBasic, searchPlacesByParams } from '../lib/foursquare';

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

let lastFsqRateLimitedAt = 0;
const FSQ_COOLDOWN_MS = 60_000; // 1 minute cooldown after a 429

// Development/test-only: if all providers fail to return places, optionally synthesize
// a few plausible nearby POIs so test harness and UI flows can be exercised.
const ALLOW_DEV_SYNTHETIC = (() => {
    const v = (process as any)?.env?.ALLOW_DEV_SYNTHETIC_PLACES
    if (v == null) return true // default enabled in dev
    const s = String(v).toLowerCase()
    return s === '1' || s === 'true' || s === 'yes'
})()

function syntheticPlacesNear(loc: LatLng, query: string, count = 5): Place[] {
    return [];
}
