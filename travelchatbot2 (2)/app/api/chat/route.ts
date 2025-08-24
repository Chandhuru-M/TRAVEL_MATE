import type { NextRequest } from "next/server"
import { FSQ_CATEGORIES } from "../../../lib/fsq-categories"

/* ===========================
   Types
=========================== */
type LatLng = { lat: number; lng: number }
type Budget = { amount: number; currency: string }
type IntentResult = {
  intent: "places" | "weather" | "trip_plan" | "fuel" | "general" | "unknown"
  category?: string
  entities?: Record<string, any>
  keyword?: string
  confidence?: number
}

type PlaceCard = {
  name: string
  address: string
  lat?: number
  lng?: number
  distanceMeters?: number
  distanceText?: string
  categories?: string[]
  fsq_id?: string
  mapsUrl?: string
  rating?: number
  phone?: string
  website?: string
  priceLevel?: number
  openNow?: boolean
  hours?: string
}

type ConversationContext = {
  lastPlaces?: PlaceCard[]
  lastPlace?: PlaceCard | null
  lastLocation?: LatLng | null
  lastBudget?: Budget | null
  conversationHistory?: Array<{ role: "user" | "bot"; content: string; timestamp: number }>
  preferences?: {
    cuisine?: string[]
    priceRange?: "budget" | "mid" | "luxury"
    travelMode?: "walking" | "driving" | "public"
  }
}

/* ===========================
   Configuration
=========================== */
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
const FOURSQUARE_URL = "https://places-api.foursquare.com/places/search"
const FOURSQUARE_API_KEY = "JF5V1BCCXN4HOT4YOGZIG5WXKAPXSK1UIUKFYGHLXBRMOGJ2"
const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"

const WEATHER_FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"

// Log API keys availability on startup
console.log("API Keys Status:")
console.log("- Gemini API Key:", process.env.GEMINI_API_KEY ? "Available" : "Missing")
console.log("- Foursquare API Key:", FOURSQUARE_API_KEY ? "Available" : "Missing")
console.log("- OpenWeather API Key:", process.env.OPENWEATHER_API_KEY ? "Available" : "Missing")

/* ===========================
   Enhanced Session Store
=========================== */
const sessionStore = new Map<string, ConversationContext>()

function getSession(id: string): ConversationContext {
  if (!sessionStore.has(id)) {
    sessionStore.set(id, {
      lastPlaces: [],
      lastPlace: null,
      lastLocation: null,
      lastBudget: null,
      conversationHistory: [],
      preferences: {},
    })
  }
  return sessionStore.get(id)!
}

function addToHistory(sessionId: string, role: "user" | "bot", content: string) {
  const session = getSession(sessionId)
  if (!session.conversationHistory) session.conversationHistory = []

  session.conversationHistory.push({
    role,
    content,
    timestamp: Date.now(),
  })

  // Keep only last 10 messages to prevent memory bloat
  if (session.conversationHistory.length > 10) {
    session.conversationHistory = session.conversationHistory.slice(-10)
  }
}

/* ===========================
   Utilities
=========================== */
function parseJSONLoose(text: string) {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim()
    return JSON.parse(cleaned)
  } catch (e) {
    console.error("Failed to parse JSON:", e)
    console.log("Raw text:", text)
    return null
  }
}

function toMapsUrl(lat: number | undefined, lng: number | undefined) {
  if (!lat || !lng) return undefined
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
}

function metersToText(m: number | undefined) {
  if (m == null) return undefined
  if (m < 1000) return `${Math.round(m)} m`
  return `${(m / 1000).toFixed(2)} km`
}

function analyzeContext(history: Array<{ role: "user" | "bot"; content: string; timestamp: number }>) {
  if (!history || history.length === 0) return {}

  const recentMessages = history.slice(-4).map((h) => h.content.toLowerCase())
  const allContent = recentMessages.join(" ")

  const context = {
    isFollowUp: /\b(that|this|it|there)\b/.test(allContent),
    mentionedCuisines: [] as string[],
    mentionedPlaceTypes: [] as string[],
    pricePreference: null as string | null,
  }

  // Extract price preferences only
  if (/\b(cheap|budget|affordable)\b/.test(allContent)) context.pricePreference = "budget"
  if (/\b(expensive|luxury|premium|fine.dining)\b/.test(allContent)) context.pricePreference = "luxury"

  return context
}

function getCategoryIds(searchTerm: string): string[] {
  const normalizedTerm = searchTerm.toLowerCase().trim()

  // Direct mapping from FSQ_CATEGORIES
  if (FSQ_CATEGORIES[normalizedTerm]) {
    return FSQ_CATEGORIES[normalizedTerm]
  }

  // Alternative mappings for common variations
  const alternativeMap: Record<string, string> = {
    petrol: "fuel station",
    gas: "fuel station",
    "gas station": "fuel station",
    "petrol bunk": "fuel station",
    "coffee shop": "cafe",
    "coffee house": "cafe",
    restaurants: "restaurant",
    hotels: "hotel",
    temples: "temple",
    churches: "temple",
    mosques: "temple",
    hospitals: "hospital",
    clinics: "hospital",
    banks: "bank",
    atms: "atm",
    gyms: "gym",
    fitness: "gym",
    malls: "mall",
    "shopping centers": "mall",
    parks: "park",
    gardens: "park",
  }

  const mappedTerm = alternativeMap[normalizedTerm]
  if (mappedTerm && FSQ_CATEGORIES[mappedTerm]) {
    return FSQ_CATEGORIES[mappedTerm]
  }

  // Fallback: search for partial matches
  for (const [key, ids] of Object.entries(FSQ_CATEGORIES)) {
    if (key.includes(normalizedTerm) || normalizedTerm.includes(key)) {
      return ids
    }
  }

  return []
}

/* ===========================
   Enhanced Intent Detection
=========================== */
async function geminiIntentExtractor(message: string, context?: any): Promise<IntentResult> {
  try {
    const contextInfo = context
      ? `
Previous conversation context: ${JSON.stringify(context, null, 2)}
Consider this context when determining intent and extracting entities.
`
      : ""

    const prompt = `
You are an advanced intent classifier for a travel assistant with context awareness.
${contextInfo}
Given the user message, return JSON with:
{
  "intent": "places" | "weather" | "trip_plan" | "fuel" | "general" | "unknown",
  "category": "<normalized category for Foursquare if places intent: e.g., restaurant, hotel, fuel station, cafe, temple, atm, bank, mall, park, museum, pharmacy, hospital, bar, coffee, supermarket, grocery, bakery, gym, spa, salon, stadium, zoo, library, university, school, bus station, train station, airport, metro station, parking>",
  "entities": { 
    "cuisine": "<if food-related>",
    "priceRange": "budget|mid|luxury",
    "timeOfDay": "morning|afternoon|evening|night",
    "groupSize": "<number if mentioned>",
    "distance": "<if specific distance mentioned>",
    "urgency": "low|medium|high"
  },
  "keyword": "<raw keyword if any>",
  "confidence": <0.0-1.0>
}

Enhanced Rules:
- If user asks about petrol bunk/gas/gas station/fuel → intent = "fuel" and category = "fuel station"
- If user asks about weather/temperature/forecast/rain/sunny → intent = "weather"
- If user asks for plan/itinerary/timing/route/schedule → intent = "trip_plan"
- If user asks for "nearby/places/find/locate" → intent = "places"
- Consider follow-up questions based on context
- Extract specific entities like cuisine, price range, time preferences
- Rate confidence based on clarity of intent

User: "${message}"
Return ONLY JSON.`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      console.log("Gemini intent status:", res.status)

      if (!res.ok) {
        console.error("Gemini intent error:", await res.text())
        return { intent: "unknown" }
      }

      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ""
      console.log("Gemini intent raw response:", text.substring(0, 150))

      const json = parseJSONLoose(text)
      if (!json?.intent) return { intent: "unknown" }
      return json
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }
  } catch (error) {
    console.error("Intent detection error:", error)
    return { intent: "unknown" }
  }
}

/* ===========================
   Enhanced Natural Language Answers
=========================== */
async function geminiAnswer(
  systemInstruction: string,
  userMessage: string,
  userLocation?: LatLng,
  budget?: Budget,
  conversationHistory?: any[],
) {
  try {
    const historyContext =
      conversationHistory && conversationHistory.length > 0
        ? `\nRecent conversation:\n${conversationHistory
            .slice(-3)
            .map((h) => `${h.role}: ${h.content}`)
            .join("\n")}`
        : ""

    const text = `You are TravelMate AI, an advanced travel assistant with personality and context awareness.

${systemInstruction}

User message: "${userMessage}"
${userLocation ? `User coordinates: ${userLocation.lat}, ${userLocation.lng}` : ""}
${budget ? `Budget: ${budget.amount} ${budget.currency}` : ""}
${historyContext}

Guidelines:
- Be conversational and helpful with a friendly tone
- Use emojis appropriately (🎯 for recommendations, 📍 for locations, 🌤️ for weather)
- Provide specific, actionable advice
- Consider user's previous questions and preferences
- Keep responses under 150 words but informative
- If suggesting places, mention why they're good choices`

    console.log("Gemini answer prompt:", text.substring(0, 200) + "...")

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)

    try {
      const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 250 },
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      console.log("Gemini answer status:", res.status)

      if (!res.ok) {
        console.error("Gemini answer error:", await res.text())
        return null
      }

      const data = await res.json()
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || null
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }
  } catch (error) {
    console.error("Gemini answer error:", error)
    return null
  }
}

/* ===========================
   Enhanced Places Search - Using Internal API
=========================== */
async function searchPlaces(params: {
  location: LatLng
  query?: string
  category?: string
  limit?: number
  radius?: number
  priceRange?: string
}): Promise<PlaceCard[]> {
  try {
    console.log("Searching places via internal API:", params)

    const categoryIds = params.category ? getCategoryIds(params.category) : []
    console.log("Mapped category IDs:", categoryIds)

    // Use absolute URL for internal API fetch (works in server environment)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.VERCEL_URL && process.env.VERCEL_URL.startsWith('http')
        ? process.env.VERCEL_URL
        : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/places/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ll: `${params.location.lat},${params.location.lng}`,
        query: params.query || params.category,
        categories: categoryIds.length > 0 ? categoryIds : undefined,
        limit: params.limit || 5,
        radius: params.radius || 5000,
      }),
    })

    console.log("Internal API status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Internal API error:", errorText)
      throw new Error(`Places search failed: ${response.status}`)
    }

    const data = await response.json()
    console.log(" Internal API response:", data.places?.length || 0, "places")

    if (!data.places || !Array.isArray(data.places) || data.places.length === 0) {
      // Log as info, not error, to avoid stack trace for expected no-result cases
      console.log("No places found in the area for:", params)
      return []
    }

    return data.places
      .map((place: any) => {
        const lat = place?.geocodes?.main?.lat || place?.latitude || place?.lat
        const lng = place?.geocodes?.main?.lng || place?.longitude || place?.lng

        const distance = place.distance ? Math.round(place.distance) : undefined
        const categories = place.categories?.map((c: any) => c.name).filter(Boolean) || []
        const rating = typeof place.rating === "number" ? place.rating : undefined

        return {
          name: place.name || "Unknown place",
          address: place.location?.formatted_address || place.location?.address || "Address not available",
          lat,
          lng,
          distanceMeters: distance,
          distanceText: metersToText(distance),
          categories,
          fsq_id: place.fsq_id,
          mapsUrl: lat && lng ? toMapsUrl(lat, lng) : undefined,
          rating,
          phone: place.tel,
          website: place.website,
          priceLevel: place.price,
          openNow: place.hours?.open_now,
          hours: place.hours?.display,
        }
      })
      .filter((place) => place.lat && place.lng && place.lat !== 0 && place.lng !== 0)
      .sort((a, b) => (a.distanceMeters ?? 1e12) - (b.distanceMeters ?? 1e12))
  } catch (error) {
    console.error("Places search failed:", error)
    throw error
  }
}

/* ===========================
   Enhanced Weather API - REAL-TIME ONLY
=========================== */
async function getWeather(location: LatLng, includeForecast = false) {
  if (!process.env.OPENWEATHER_API_KEY) {
    throw new Error("OpenWeather API key is required for real-time weather data")
  }

  try {
    const lat = location?.lat
    const lng = location?.lng

    if (!lat || !lng) {
      throw new Error("Valid location coordinates are required")
    }

    const currentUrl = `${WEATHER_URL}?lat=${lat}&lon=${lng}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)

    try {
      const response = await fetch(currentUrl, { signal: controller.signal })
      clearTimeout(timeoutId)

      console.log("Weather API status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Weather API error:", errorText)
        throw new Error(`Weather API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      const description = data.weather?.[0]?.description || "unknown"
      const temp = data.main?.temp != null ? Math.round(data.main.temp) : null
      const feelsLike = data.main?.feels_like != null ? Math.round(data.main.feels_like) : null
      const humidity = data.main?.humidity
      const wind = data?.wind?.speed != null ? `${Math.round(data.wind.speed)} m/s wind` : null
      const visibility = data.visibility ? `${(data.visibility / 1000).toFixed(1)} km visibility` : null

      let weatherReport = `Current weather is ${description}, temperature: ${temp}°C${feelsLike ? ` (feels like ${feelsLike}°C)` : ""}`

      if (humidity) weatherReport += `, humidity: ${humidity}%`
      if (wind) weatherReport += `, ${wind}`
      if (visibility) weatherReport += `, ${visibility}`

      return weatherReport
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }
  } catch (error) {
    console.error("Weather fetch error:", error)
    throw error
  }
}

/* ===========================
   Enhanced Response Formatters
=========================== */
function formatPlaces(places: PlaceCard[], context?: any) {
  if (!places.length) throw new Error("No places found in your area")

  let result = "Here are recommendations within 5 km of your location:\n\n"

  places.forEach((place, index) => {
    result += `**${index + 1}. ${place.name}**\n`
    result += `${place.address}\n`
    if (place.distanceText) result += `${place.distanceText} away\n`
    if (place.categories?.length) result += `${place.categories.join(", ")}\n`
    if (place.rating) result += `Rating: ${place.rating}/5\n`
    if (place.phone) result += `${place.phone}\n`
    if (place.openNow !== undefined) result += `${place.openNow ? "Open now" : "Closed"}\n`
    if (place.hours) result += `${place.hours}\n`
    if (place.priceLevel) {
      const priceSymbols = "₹".repeat(place.priceLevel)
      result += `Price: ${priceSymbols}\n`
    }
    if (place.mapsUrl) result += `[View on Maps](${place.mapsUrl})\n`
    result += "\n"
  })

  return result.trim()
}

/* ===========================
   Main Handler
=========================== */
export async function POST(req: NextRequest) {
  try {
    // Parse request
    const body = await req.json()
    console.log("Received request:", body)

    const { message, location, budget, sessionId, fuelLevel } = body
    const userMessage = (message ?? "").toString()
    const userLocation: LatLng | null = location ?? null
    const userBudget: Budget | null = budget ?? null
    const sid = (sessionId ?? "default").toString()

    console.log(`Processing request for session ${sid}, message: "${userMessage}"`)

    const session = getSession(sid)
    if (userLocation) session.lastLocation = userLocation
    if (userBudget) session.lastBudget = userBudget

    // Add user message to history
    addToHistory(sid, "user", userMessage)

    // Analyze conversation context
    const conversationContext = analyzeContext(session.conversationHistory || [])

    // Handle distance questions about previous places
    if (/how (far|many (km|kilometers|metres|meters))|distance/i.test(userMessage) && session.lastPlace) {
      const place = session.lastPlace
      const distanceText = place.distanceText || "distance not available"
      const reply = `The distance to **${place.name}** is ${distanceText}. ${place.mapsUrl ? `\n[View on Maps](${place.mapsUrl})` : ""}`
      addToHistory(sid, "bot", reply)
      return Response.json({
        reply,
        places: [place],
      })
    }

    const nearbyMatch = userMessage.match(/near\s?by\s+(\w+)/i)
    if (nearbyMatch && nearbyMatch[1]) {
      let placeType = nearbyMatch[1].toLowerCase()

      const queryMappings: Record<string, string> = {
        me: "restaurant",
        pertrol: "fuel station",
        petrol: "fuel station",
        gas: "fuel station",
        location: "restaurant",
        places: "restaurant",
      }

      if (queryMappings[placeType]) {
        placeType = queryMappings[placeType]
        console.log(`Mapped query "${nearbyMatch[1]}" to "${placeType}"`)
      }

      if (!userLocation) {
        const reply = `I need your location to find ${placeType} locations within 5 km of you.`
        addToHistory(sid, "bot", reply)
        return Response.json({ reply })
      }

      try {
        console.log(`Searching for nearby ${placeType} with context:`, conversationContext)
        const places = await searchPlaces({
          location: userLocation,
          query: placeType,
          category: placeType,
          priceRange: conversationContext.pricePreference || undefined,
        })

        session.lastPlaces = places
        session.lastPlace = places[0]
        const reply = formatPlaces(places, conversationContext)
        addToHistory(sid, "bot", reply)
        return Response.json({
          reply,
          places: places.map((place) => ({
            id: place.fsq_id || `place-${Math.random().toString(36).substring(2, 12)}`,
            name: place.name,
            latitude: place.lat || 0,
            longitude: place.lng || 0,
            address: place.address,
            category: place.categories?.[0] || "",
            rating: place.rating,
            phone: place.phone,
            website: place.website,
          })),
        })
      } catch (error) {
        // If error is just no places found, don't log as error
        if (Array.isArray(error) || (typeof error === 'object' && error !== null && error.message === undefined)) {
          const reply = `No ${placeType} locations found within 5 km. Try another category or location.`
          addToHistory(sid, "bot", reply)
          return Response.json({ reply })
        }
        console.error(`Error finding ${placeType}:`, error)
        const reply = `No ${placeType} locations found within 5 km. Try another category or location.`
        addToHistory(sid, "bot", reply)
        return Response.json({ reply })
      }
    }

    // Enhanced weather handling
    if (/weather|temperature|forecast|rain|sunny|cloudy/i.test(userMessage)) {
      if (!userLocation) {
        const reply = "I need your location to check the weather."
        addToHistory(sid, "bot", reply)
        return Response.json({ reply })
      }

      try {
        const includeForecast = /forecast|tomorrow|week/i.test(userMessage)
        const weather = await getWeather(userLocation, includeForecast)
        addToHistory(sid, "bot", weather)
        return Response.json({ reply: weather })
      } catch (error) {
        console.error("Weather error:", error)
        const reply = "Unable to get weather data. API service may be unavailable."
        addToHistory(sid, "bot", reply)
        return Response.json({ reply })
      }
    }

    // Enhanced intent detection with context
    const intent = await geminiIntentExtractor(userMessage, conversationContext)
    console.log("Detected intent:", intent)

    // Handle the intent with enhanced responses
    try {
      switch (intent.intent) {
        case "places":
          if (!userLocation) {
            const reply = "I need your location to find places."
            addToHistory(sid, "bot", reply)
            return Response.json({ reply })
          }

          try {
            const category = (intent.category || intent.keyword || "restaurant").toLowerCase()
            const query = intent.keyword || category
            const priceRange = intent.entities?.priceRange || conversationContext.pricePreference

            const places = await searchPlaces({
              location: userLocation,
              query: query,
              category: category,
              limit: 6,
              radius: 6000,
              priceRange: priceRange,
            })

            session.lastPlaces = places
            session.lastPlace = places[0]
            const reply = formatPlaces(places, { ...conversationContext, intent })
            addToHistory(sid, "bot", reply)
            return Response.json({
              reply,
              places: places.map((place) => ({
                id: place.fsq_id || `place-${Math.random().toString(36).substring(2, 12)}`,
                name: place.name,
                latitude: place.lat || 0,
                longitude: place.lng || 0,
                address: place.address,
                category: place.categories?.[0] || "",
                rating: place.rating,
                phone: place.phone,
                website: place.website,
              })),
            })
          } catch (error) {
            console.error("Places search error:", error)
            const reply = "Unable to find places. API service may be unavailable."
            addToHistory(sid, "bot", reply)
            return Response.json({ reply })
          }
          break

        case "weather":
          if (!userLocation) {
            const reply = "I need your location to check the weather."
            addToHistory(sid, "bot", reply)
            return Response.json({ reply })
          }

          try {
            const weather = await getWeather(userLocation, /forecast/.test(userMessage))
            addToHistory(sid, "bot", weather)
            return Response.json({ reply: weather })
          } catch (error) {
            console.error("Weather error:", error)
            const reply = "Unable to get weather data. API service may be unavailable."
            addToHistory(sid, "bot", reply)
            return Response.json({ reply })
          }
          break

        case "fuel":
          if (typeof fuelLevel === "number" && fuelLevel > 25) {
            const tip = await geminiAnswer(
              "Provide a brief tip about fuel management.",
              userMessage,
              userLocation ?? session.lastLocation ?? undefined,
              userBudget ?? session.lastBudget ?? undefined,
              session.conversationHistory,
            )

            if (tip) {
              addToHistory(sid, "bot", tip)
              return Response.json({ reply: tip })
            } else {
              throw new Error("Unable to generate fuel tip")
            }
          }

          if (!userLocation) {
            const reply = "I need your location to find fuel stations."
            addToHistory(sid, "bot", reply)
            return Response.json({ reply })
          }

          try {
            const fuelStations = await searchPlaces({
              location: userLocation,
              query: "fuel station",
              category: "fuel station",
              limit: 6,
              radius: 7000,
            })

            session.lastPlaces = fuelStations
            session.lastPlace = fuelStations[0]
            const reply = "Nearby fuel stations:\n\n" + formatPlaces(fuelStations)
            addToHistory(sid, "bot", reply)
            return Response.json({
              reply,
              places: fuelStations.map((place) => ({
                id: place.fsq_id || `place-${Math.random().toString(36).substring(2, 12)}`,
                name: place.name,
                latitude: place.lat || 0,
                longitude: place.lng || 0,
                address: place.address,
                category: place.categories?.[0] || "",
                rating: place.rating,
                phone: place.phone,
                website: place.website,
              })),
            })
          } catch (error) {
            console.error("Fuel stations search error:", error)
            const reply = "Unable to find fuel stations. API service may be unavailable."
            addToHistory(sid, "bot", reply)
            return Response.json({ reply })
          }
          break

        case "trip_plan":
          const plan = await geminiAnswer(
            "Create a travel plan with specific details.",
            userMessage,
            userLocation ?? session.lastLocation ?? undefined,
            userBudget ?? session.lastBudget ?? undefined,
            session.conversationHistory,
          )

          if (plan) {
            addToHistory(sid, "bot", plan)
            return Response.json({ reply: plan })
          } else {
            throw new Error("Unable to generate trip plan")
          }
          break

        default:
          const general = await geminiAnswer(
            "Answer helpfully with travel context.",
            userMessage,
            userLocation ?? session.lastLocation ?? undefined,
            userBudget ?? session.lastBudget ?? undefined,
            session.conversationHistory,
          )

          if (general) {
            addToHistory(sid, "bot", general)
            return Response.json({ reply: general })
          }

          throw new Error("Unable to process request")
      }
    } catch (intentError) {
      console.error("Error handling intent:", intentError)
      const reply = "Unable to process your request. API service may be unavailable."
      addToHistory(sid, "bot", reply)
      return Response.json({ reply })
    }
  } catch (error) {
    console.error("Chat API error:", error)
    const reply = "Service unavailable. Please check your connection and try again."
    return Response.json({ reply }, { status: 500 })
  }
}
