# TRAVEL MATE

Plan trips, track budgets, save places, manage photos (local-only), and find nearby fuel stations — built with Expo + React Native.

## Overview

Travel Mate is a mobile travel companion that helps you:
- Create day-by-day itineraries and manage events.
- Save places and navigate quickly.
- Track trip budgets with a wallet-style overview.
- Capture and manage trip photos stored locally on-device (with delete).
- Discover nearby fuel stations using GPS with a Foursquare Places search.

## Features

- Trip planner with dynamic days and default daily events.
- Saved Places list and quick add-to-itinerary actions.
- Budget view with spend progress and recent transactions.
- Photos tab per trip (offline-first via AsyncStorage).
- Fuel Stations screen with GPS fallback and Foursquare Places search.

## Tech Stack

- Expo + React Native (TypeScript), Expo Router
- Foursquare Places API (search + details)
- Expo Location (GPS), Linking (Maps)
- AsyncStorage (local photo storage)
- Supabase (trip metadata, itinerary, budget)

## Getting Started

### Prerequisites
- Node.js 18+
- Git
- Expo CLI (or use `npx expo`)
- Android Studio/Xcode simulators, or Expo Go on a device

### Clone and install

```bash
# Clone
git clone https://github.com/Chandhuru-M/TRAVEL_MATE.git
cd TRAVEL_MATE

# Install deps
npm install
```

### Environment variables
Create a `.env` in the project root with the following keys:

```ini
# Foursquare Places API (required)
EXPO_PUBLIC_FOURSQUARE_API_KEY=YOUR_FSQ_API_KEY
# Optional: pin API version
EXPO_PUBLIC_FOURSQUARE_API_VERSION=2025-06-17

# Supabase (required for trips/itinerary/budget)
EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Photos are stored locally on device now (no storage bucket required)
```

Restart the dev server after editing `.env` so Expo picks up changes.

### Run the app

```bash
# Start Metro
npx expo start

# Clear cache (optional if you switch env or platforms)
npx expo start -c
```

Scan the QR code with Expo Go (Android) or run on emulators from the Expo Dev Tools.

## Configuration & Permissions

- Location: The app requests foreground location to fetch nearby fuel stations.
- Camera/Photos: Used to capture/select trip photos; photos are saved locally via AsyncStorage.
- `app.json` contains iOS/Android permission strings. If you change them, rebuild or restart the app.

## Foursquare Usage

- Endpoints
  - `GET /places/search` — query nearby places (e.g., `query=gas station`, `ll=lat,lng`, `radius`, `limit`).
  - `GET /places/{id}` — fetch place details if geocodes or metadata are missing.
- Key fields used: `geocodes.main.lat/lng`, `location.formatted_address`, `categories.name`, `distance`, `fsq_id`.

## Supabase

- Used to store trip plans, itinerary items, saved places, and budget data.
- Ensure Row Level Security (RLS) policies allow the app’s anon key to read/write your project’s `trip_plans` table per your security model.
- Photos are not uploaded to Supabase Storage in the current build (local-only to keep the feature usable offline).

## Troubleshooting

- Location error / no fuel stations:
  - Ensure device location permission is granted and services are enabled.
  - Verify `.env` has a valid `EXPO_PUBLIC_FOURSQUARE_API_KEY`.
- Env changes not applied:
  - Stop Metro and run `npx expo start -c`.
- Image picker not opening:
  - Check platform permissions in device settings and `app.json`.

## Scripts

- Start: `npx expo start`
- Clear cache: `npx expo start -c`

## License

This project is open source under the MIT License.
