// src/lib/types.ts

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Place {
  fsq_id: string;
  name: string;
  categories: { name: string }[];
  distance?: number;
  location?: {
    formatted_address?: string;
    address?: string;
    locality?: string;
  };
  geocodes?: {
    main?: LatLng;
  };
  rating?: number;
  price?: number;
  photos?: { prefix: string; suffix: string }[];
}