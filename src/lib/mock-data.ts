// src/lib/mock-data.ts

import { Place } from './types'; // We will use the Place type we already defined

// Mock data for a list of places (like from Foursquare)
export const mockPlaces: Place[] = [
  {
    fsq_id: 'place_001',
    name: 'Eiffel Tower',
    categories: [{ name: 'Landmark' }, { name: 'Tourist Attraction' }],
    distance: 1200,
    location: {
      formatted_address: 'Champ de Mars, 5 Av. Anatole France, 75007 Paris, France',
    },
    geocodes: {
      main: { lat: 48.8584, lng: 2.2945 },
    },
    rating: 9.5,
    price: 3,
    photos: [{ prefix: 'https://fastly.4sqi.net/img/general/', suffix: '/123.jpg' }],
  },
  {
    fsq_id: 'place_002',
    name: 'Louvre Museum',
    categories: [{ name: 'Art Museum' }],
    distance: 2500,
    location: {
      formatted_address: 'Rue de Rivoli, 75001 Paris, France',
    },
    geocodes: {
      main: { lat: 48.8606, lng: 2.3376 },
    },
    rating: 9.8,
    price: 4,
    photos: [{ prefix: 'https://fastly.4sqi.net/img/general/', suffix: '/456.jpg' }],
  },
  {
    fsq_id: 'place_003',
    name: 'Le Relais de l\'Entrecôte',
    categories: [{ name: 'Steakhouse' }, { name: 'French Restaurant' }],
    distance: 800,
    location: {
      formatted_address: '15 Rue Marbeuf, 75008 Paris, France',
    },
    geocodes: {
      main: { lat: 48.8677, lng: 2.3025 },
    },
    rating: 9.2,
    price: 2,
    photos: [{ prefix: 'https://fastly.4sqi.net/img/general/', suffix: '/789.jpg' }],
  },
];