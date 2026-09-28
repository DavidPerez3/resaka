import type { Venue, VenueCategory } from '@/domain/venues';
import { venueDistanceFromPoint } from '@/domain/venues';
import type { LocationPoint } from '@/services/location/types';
import type { VenueProvider } from '@/services/venues/types';

const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.nchc.org.tw/api/interpreter',
] as const;
const DEFAULT_RADIUS_METERS = 500;
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_RESULTS = 30;
const APP_USER_AGENT = 'RESAKA/0.1.2 (https://github.com/DavidPerez3/resaka)';

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
    const query = buildQuery(point, radiusMeters);
    let lastError: unknown;

    for (const endpoint of OVERPASS_URLS) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': APP_USER_AGENT,
            Referer: 'https://github.com/DavidPerez3/resaka',
          },
          body: `data=${encodeURIComponent(query)}`,
          signal: controller.signal,
        });

        if (!response.ok) {
          lastError = new Error(`OpenStreetMap respondió con ${response.status}.`);
          continue;
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
        lastError = error;
      } finally {
        clearTimeout(timeout);
      }
    }

    if (lastError instanceof Error && lastError.name === 'AbortError') {
      throw new Error('La búsqueda de garitos ha tardado demasiado. Prueba otra vez.');
    }
    throw new Error('No se han podido cargar los garitos de OpenStreetMap. Prueba de nuevo en unos segundos.');
  }
}

export const venueProvider: VenueProvider = new OverpassVenueProvider();
