/* Simple Foursquare API health check (uses .env). Safe output only. */
const axios = require('axios');

const API_KEY = process.env.EXPO_PUBLIC_FOURSQUARE_API_KEY || process.env.FOURSQUARE_API_KEY || process.env.NEXT_PUBLIC_FOURSQUARE_API_KEY;
const API_VERSION = process.env.EXPO_PUBLIC_FOURSQUARE_API_VERSION || '2025-06-17';
const mask = (k) => (k ? `${k.slice(0,4)}...${k.slice(-4)}` : 'missing');

if (!API_KEY) {
  console.error('[FSQ] Missing API key. Set EXPO_PUBLIC_FOURSQUARE_API_KEY in .env');
  process.exit(1);
}
console.log('[FSQ] Using key:', mask(API_KEY), 'version:', API_VERSION);
if (!/^fsq3/i.test(API_KEY)) {
  console.warn('[FSQ] Warning: This does not look like a v3 Places API key (expected it to start with "fsq3"). Please create a Places API key in Foursquare Developer Console and use that.');
}

async function main() {
  try {
    // Nearby search check (Chennai coordinates as a sample)
    const ll = '13.0827,80.2707';
    const fields = 'fsq_id,name,geocodes,location,categories,rating,distance';
  const url = `https://api.foursquare.com/v3/places/search?ll=${ll}&query=restaurant&limit=3&sort=DISTANCE&fields=${encodeURIComponent(fields)}`;
    const searchRes = await axios.get(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `${API_KEY}`,
        'X-Places-Api-Version': API_VERSION,
      },
      timeout: 8000,
    });
    const results = searchRes.data?.results || [];
    console.log(`[FSQ] Search OK. Results: ${results.length}`);
    if (results[0]) {
      const p = results[0];
      console.log('[FSQ] Sample:', {
        name: p?.name,
        address: p?.location?.formatted_address,
        lat: p?.geocodes?.main?.latitude,
        lng: p?.geocodes?.main?.longitude,
      });
    }
    process.exit(0);
  } catch (e) {
    if (e.response) {
      console.error('[FSQ] Error:', e.response.status, e.response.data);
      if (e.response.status === 401) {
        console.error('[FSQ] 401 Unauthorized. Likely causes:');
        console.error(' - Using the old client_id/client_secret or a non-Places key. You need a v3 Places API key that starts with "fsq3".');
        console.error(' - Wrong Authorization header format. It must be the raw key (no "Bearer").');
      }
    } else {
      console.error('[FSQ] Error:', e.message);
    }
    process.exit(2);
  }
}

main();
