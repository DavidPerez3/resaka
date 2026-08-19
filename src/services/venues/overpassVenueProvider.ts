import type { Venue, VenueCategory } from '@/domain/venues';
import { venueDistanceFromPoint } from '@/domain/venues';
import type { LocationPoint } from '@/services/location/types';
import type { VenueProvider } from '@/services/venues/types';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const DEFAULT_RADIUS_METERS = 500;
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_RESULTS = 30;

type OverpassElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

function categoryFromAmenity(value?: string): VenueCategory {
  if (value === 'bar') return 'BAR';
  if (value === 'pub') return 'PUB';
  if (value === 'nightclub') return 'NIGHTCLUB';
  if (value === 'biergarten') return 'BIERGARTEN';
  return 'OTHER';
}

function buildAddress(tags: Record<string, string>) {
  const street = tags['addr:street'];
  const number = tags['addr:housenumber'];
  const city = tags['addr:city'];
  const first = [street, number].filter(Boolean).join(' ');
  return [first, city].filter(Boolean).join(', ') || undefined;
}

function toVenue(element: OverpassElement): Venue | null {
  const tags = element.tags ?? {};
  const name = tags.name?.trim();
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;

  if (!name || typeof latitude !== 'number' || typeof longitude !== 'number') return null;

  const externalId = `${element.type}/${element.id}`;
  return {
    id: `osm:${externalId}`,
    externalId,
    name,
    latitude,
    longitude,
    address: buildAddress(tags),
    category: categoryFromAmenity(tags.amenity),
    source: 'OSM',
    createdAt: new Date().toISOString(),
  };
}

function buildQuery(point: LocationPoint, radiusMeters: number) {
  const radius = Math.max(100, Math.min(1500, Math.round(radiusMeters)));
  const lat = point.latitude.toFixed(6);
  const lon = point.longitude.toFixed(6);

  return `[out:json][timeout:10];
(
  nwr["amenity"~"^(bar|pub|nightclub|biergarten)$"](around:${radius},${lat},${lon});
);
out center tags;`;
}

class OverpassVenueProvider implements VenueProvider {
  async searchNearby(point: LocationPoint, radiusMeters = DEFAULT_RADIUS_METERS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const query = buildQuery(point, radiusMeters);
      const response = await fetch(OVERPASS_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`OpenStreetMap respondió con ${response.status}.`);
      }

      const payload = (await response.json()) as OverpassResponse;
      const venues = (payload.elements ?? [])
        .map(toVenue)
        .filter((venue): venue is Venue => Boolean(venue));

      const unique = new Map<string, Venue>();
      for (const venue of venues) unique.set(venue.id, venue);

      return Array.from(unique.values())
        .map((venue) => ({ venue, distanceMeters: venueDistanceFromPoint(venue, point) }))
        .sort((left, right) => left.distanceMeters - right.distanceMeters)
        .slice(0, MAX_RESULTS);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('La búsqueda de garitos ha tardado demasiado. Prueba otra vez.');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const venueProvider: VenueProvider = new OverpassVenueProvider();
