import { Observation, WeatherData, BiotaResult } from '../types';

const INAT_API_BASE = 'https://api.inaturalist.org/v1';

// --- iNaturalist Service ---

export const searchTaxonId = async (scientificName: string): Promise<number | null> => {
  try {
    const res = await fetch(`${INAT_API_BASE}/taxa?q=${scientificName}&per_page=1`);
    const data = await res.json();
    return data.results?.[0]?.id || null;
  } catch (e) {
    console.error("Failed to fetch taxon ID", e);
    return null;
  }
};

export const fetchObservations = async (taxonId: number, page = 1): Promise<Observation[]> => {
  try {
    // Fetch research grade or needs_id, has photos, has geo
    const url = `${INAT_API_BASE}/observations?taxon_id=${taxonId}&per_page=200&page=${page}&captive=false&order_by=observed_on&quality_grade=research,needs_id`;
    const res = await fetch(url);
    const data = await res.json();
    return data.results.filter((o: any) => o.geojson && o.geojson.coordinates);
  } catch (e) {
    console.error("Failed to fetch observations", e);
    return [];
  }
};

export const fetchNearbyBiota = async (lat: number, lng: number): Promise<BiotaResult> => {
  const radius = 15; // km
  const fetchType = async (taxonId: number) => {
    const url = `${INAT_API_BASE}/observations?lat=${lat}&lng=${lng}&radius=${radius}&taxon_id=${taxonId}&per_page=3&order_by=created_at`;
    const res = await fetch(url);
    const data = await res.json();
    return data.results || [];
  };

  const [plants, insects, animals] = await Promise.all([
    fetchType(47126), // Plantae
    fetchType(47158), // Insecta
    fetchType(355675), // Vertebrata (excluding turtles ideally, but generic for now)
  ]);

  return { plants, insects, animals };
};

// --- Open-Meteo Service ---

export const fetchHistoricalWeather = async (lat: number, lng: number): Promise<WeatherData | null> => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);

    const format = (d: Date) => d.toISOString().split('T')[0];

    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${format(startDate)}&end_date=${format(endDate)}&daily=temperature_2m_mean,relative_humidity_2m_mean&timezone=auto`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.daily) return null;

    return {
      time: data.daily.time,
      temperature_2m_mean: data.daily.temperature_2m_mean,
      relative_humidity_2m_mean: data.daily.relative_humidity_2m_mean
    };
  } catch (e) {
    console.error("Failed to fetch weather", e);
    return null;
  }
};
