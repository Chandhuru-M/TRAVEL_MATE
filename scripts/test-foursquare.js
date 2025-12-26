const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Load .env manually to avoid dependencies
const envPath = path.join(__dirname, '..', '.env');
const env = fs.readFileSync(envPath, 'utf8');
const lines = env.split(/\r?\n/);
const vars = {};
for (const l of lines) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
  if (m) vars[m[1]] = m[2];
}

const SERVICE_KEY = vars.EXPO_PUBLIC_FOURSQUARE_API_KEY;
const API_VERSION = vars.EXPO_PUBLIC_FOURSQUARE_API_VERSION || '2025-06-17';

if (!SERVICE_KEY) {
  console.error('Missing EXPO_PUBLIC_FOURSQUARE_API_KEY in .env');
  process.exit(1);
}

async function test() {
  try {
    const lat = 37.7749; // SF
    const lon = -122.4194;
    const params = new URLSearchParams({ ll: `${lat},${lon}`, query: 'restaurant', limit: '2', radius: '1000' }).toString();
    const url = `https://places-api.foursquare.com/places/search?${params}`;
    console.log('GET', url);
    const headers = {
      accept: 'application/json',
      Authorization: `Bearer ${SERVICE_KEY}`,
      'X-Places-Api-Version': API_VERSION,
    };
    const res = await axios.get(url, { headers, timeout: 10000 });
    console.log('status', res.status);
    console.log('results:', Array.isArray(res.data.results) ? `count=${res.data.results.length}` : Object.keys(res.data).slice(0,5));
    if (Array.isArray(res.data.results) && res.data.results.length > 0) {
      console.log('sample:', JSON.stringify(res.data.results[0], null, 2));
    } else {
      console.log('response body:', JSON.stringify(res.data, null, 2));
    }
  } catch (err) {
    if (err.response) {
      console.error('HTTP error', err.response.status, err.response.data);
    } else {
      console.error('Request failed', err.message);
    }
    process.exit(2);
  }
}

test();
