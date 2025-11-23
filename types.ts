export interface Taxon {
  id: number;
  name: string;
  preferred_common_name: string;
  default_photo?: {
    medium_url: string;
  };
}

export interface Observation {
  id: number;
  uuid: string;
  quality_grade: string; // "research" or "casual"
  observed_on: string;
  time_observed_at: string;
  description: string | null;
  geojson: {
    coordinates: [number, number]; // [lng, lat]
    type: "Point";
  };
  location: string; // "lat,lng"
  photos: Array<{
    url: string;
    large_url?: string; // constructed manually
  }>;
  user: {
    login: string;
    icon_url: string | null;
  };
  taxon: Taxon;
}

export interface WeatherData {
  time: string[];
  temperature_2m_mean: number[];
  relative_humidity_2m_mean: number[];
}

export interface SpeciesConfig {
  id: string; // Custom ID for our app
  name: string; // Scientific name for query
  commonName: string; // Display name
  defaultCenter: [number, number]; // [lat, lng]
  defaultZoom: number;
}

export interface BiotaResult {
  plants: Observation[];
  insects: Observation[];
  animals: Observation[];
}