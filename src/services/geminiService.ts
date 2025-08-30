import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchPlaces } from "@/lib/foursquare";
import { Place } from "@/lib/types";
import { getWeather } from "./weatherService";
import { useTripStore } from "./tripService";
import { useFinanceStore } from "./financeService";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("Gemini API key is not defined. Please set EXPO_PUBLIC_GEMINI_API_KEY in your environment.");
}

const genAI = new GoogleGenerativeAI(API_KEY as string);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

export type GeminiChatResponse = {
  reply: string;
  places?: Place[];
};

export async function analyzeTextWithGemini(prompt: string, location: { lat: number; lng: number } | null): Promise<GeminiChatResponse> {
  const lc = (prompt || '').toLowerCase();

  // Simple retry helper with exponential backoff for transient Gemini errors (e.g., 503 overloaded)
  const withRetry = async <T>(fn: () => Promise<T>, retries = 2, baseDelayMs = 500): Promise<T> => {
    let lastErr: any;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        lastErr = err;
        const msg = String(err?.message || err);
        const status = (err as any)?.status || (err as any)?.response?.status || (err as any)?.cause?.status;
        const isOverloaded = msg.includes('overloaded') || status === 503;
        if (attempt < retries && (isOverloaded || status === 429 || status === 500)) {
          const delay = baseDelayMs * Math.pow(2, attempt); // 500, 1000, 2000
          await new Promise(res => setTimeout(res, delay));
          continue;
        }
        throw err;
      }
    }
    throw lastErr;
  };

  // Heuristics: detect place intent robustly
  const isPlaceIntent = /(nearby|near by|near me|around|places|find|looking for|recommend|suggest|hotel|hotels|restaurant|restaurants|food|cafe|coffee|park|atm|bank|mall|gym|fuel|gas|petrol|temple|pharmacy|hospital|supermarket|grocery|things to do)/i.test(lc);

  // Transport and radius hints
  const wantsWalking = /(walk|walking)/i.test(lc);
  const wantsCycling = /(cycle|cycling|bike|bicycle)/i.test(lc);
  let radius = wantsWalking ? 3000 : wantsCycling ? 5000 : 10000; // meters
  const withinMatch = lc.match(/within\s+(\d+(?:\.\d+)?)\s*(km|kilometer|kilometre|m|meter|metre)/);
  if (withinMatch) {
    const val = parseFloat(withinMatch[1]);
    const unit = withinMatch[2];
    if (!isNaN(val)) radius = /km|kilometer|kilometre/.test(unit) ? Math.max(500, Math.min(30000, val * 1000)) : Math.max(200, Math.min(30000, val));
  }

  // Build rich context (trip, finance, weather)
  let contextInfo = '';
  const { tripPlans, activeTripPlanId } = useTripStore.getState();
  const { accounts } = useFinanceStore.getState();
  if (activeTripPlanId && tripPlans.length > 0) {
    const activePlan = tripPlans.find(p => p.id === activeTripPlanId);
    if (activePlan) {
      contextInfo += `\n\nActive Trip: ${activePlan.name} to ${activePlan.destination}.`;
      contextInfo += `\nItinerary: ${activePlan.itinerary.slice(0, 5).map(i => i.place?.name || i.defaultType).join(', ')}.`;
    }
  }
  if (accounts.length > 0) {
    contextInfo += `\n\nFinancials:`;
    accounts.forEach(acc => { contextInfo += `\n- ${acc.name}: ${acc.balance.toFixed(2)}`; });
  }
  if (location) {
    try {
      const weather = await getWeather(location.lat, location.lng);
      contextInfo += `\n\nCurrent Weather: ${weather.weather?.[0]?.main || 'N/A'}, ${Math.round(weather.main?.temp)}°C.`;
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
  }

  // Helper: normalize FSQ query from user prompt
  const normalizeQuery = (text: string): { query: string; tried: string[] } => {
    const STOP = ['nearby','near by','near','near me','around me','around','find','show','search','looking for','places','place','spots','good','best','nice','recommend','suggest'];
    let cleaned = text.toLowerCase();
    STOP.forEach(s => { cleaned = cleaned.replace(new RegExp(`\\b${s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'g'), ' '); });
    cleaned = cleaned.replace(/\s+/g,' ').trim();

    const synonyms: Record<string, string[]> = {
      'hotel': ['hotel','hotels','stay','lodging','accommodation'],
      'restaurant': ['restaurant','restaurants','food','eat','dinner','lunch','breakfast','eatery'],
      'cafe': ['cafe','coffee','coffee shop'],
      'fuel station': ['fuel','gas','gas station','petrol','petrol pump','fuel station'],
      'atm': ['atm','cash','cash withdrawal'],
      'park': ['park','garden'],
      'mall': ['mall','shopping','shopping mall'],
      'gym': ['gym','fitness','workout'],
      'temple': ['temple','monastery','pagoda','shrine'],
      'pharmacy': ['pharmacy','chemist','drugstore'],
      'hospital': ['hospital','clinic'],
      'supermarket': ['supermarket','grocery','groceries','market'],
      'bank': ['bank']
    };
    for (const [canon, keys] of Object.entries(synonyms)) {
      if (keys.some(k => cleaned.includes(k))) return { query: canon, tried: [canon, ...keys] };
    }
    if (!cleaned) return { query: 'restaurant', tried: ['restaurant'] };
    return { query: cleaned, tried: [cleaned] };
  };

  if (isPlaceIntent && location) {
    try {
      const { query, tried } = normalizeQuery(lc);
      let places = await fetchPlaces({ lat: location.lat, lon: location.lng, query, radius, limit: 10 });

      // Fallbacks: if no results, try a couple of alternates based on common synonyms
      if (places.length === 0) {
        const alternates: Record<string, string[]> = {
          'hotel': ['lodging','inn','guest house','hostel'],
          'restaurant': ['eatery','food court','diner','bistro'],
          'cafe': ['coffee','coffee shop'],
          'fuel station': ['petrol pump','gas station','fuel'],
          'gym': ['fitness center','health club'],
          'supermarket': ['grocery','groceries','market'],
          'temple': ['shrine','monastery','pagoda'],
        };
        const alts = alternates[query] || [];
        for (const alt of alts) {
          const trial = await fetchPlaces({ lat: location.lat, lon: location.lng, query: alt, radius: Math.max(radius, 15000), limit: 10 });
          if (trial.length) { places = trial; break; }
        }
      }

      if (places.length > 0) {
        const placesInfo = places.slice(0, 6).map((p, i) => `${i + 1}. ${p.name} (${p.categories?.[0]?.name || 'place'}) at ${p.location?.formatted_address || 'address n/a'}`).join('\n');
        const summaryPrompt = `The user asked: "${prompt}". You have this context: ${contextInfo}. Based on the list below, write a concise, friendly recommendation mentioning 3-5 options, add short tips (budget, distance cues), and invite the user to pick a number for navigation.\nPlaces:\n${placesInfo}`;
        try {
          const result = await withRetry(() => model.generateContent(summaryPrompt), 2, 500);
          const reply = result.response.text() || `Here are some options near you:\n\n${places.slice(0,6).map((p,i)=> `${i+1}. ${p.name} — ${p.location?.formatted_address || ''}`).join('\n')}`;
          return { reply, places };
        } catch (err) {
          // Graceful fallback when Gemini is overloaded/unavailable
          const fallback = `Here are some options near you:\n\n${places.slice(0,6).map((p,i)=> `${i+1}. ${p.name} — ${p.location?.formatted_address || ''}`).join('\n')}\n\nReply with a number (1-${Math.min(6, places.length)}) to start navigation.`;
          return { reply: fallback, places };
        }
      }

      // No places found at all
      return { reply: `I couldn't find results for "${query}" nearby. Try another category like hotel, restaurant, cafe, park, mall, ATM, or expand the search radius.`, places: [] };
    } catch (error) {
      console.error('Error during Foursquare/Gemini place search:', error);
      return { reply: 'Sorry, I had trouble searching nearby places. Please try again.' };
    }
  }

  // Fallback: general Gemini chat with context
  try {
    const chatSession = model.startChat({
      generationConfig: { ...generationConfig, responseMimeType: 'text/plain' },
      history: [],
    });
    const fullPrompt = location
      ? `${prompt}\n\n(User's current location: latitude ${location.lat}, longitude ${location.lng}. ${contextInfo})`
      : prompt;
    const result = await withRetry(() => chatSession.sendMessage(fullPrompt), 2, 500);
    return { reply: result.response.text() };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    // Friendly degraded response
    return { reply: "I'm a bit busy right now. Please try again in a moment or ask for nearby places like 'nearby hotel' or 'cafes within 2 km'." };
  }
}
