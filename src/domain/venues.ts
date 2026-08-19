import { distanceBetweenPoints } from '@/domain/route';
import type { LocationPoint } from '@/services/location/types';

export type VenueSource = 'OSM' | 'MANUAL';
export type VenueCategory = 'BAR' | 'PUB' | 'NIGHTCLUB' | 'BIERGARTEN' | 'OTHER';

export interface Venue {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  category: VenueCategory;
  source: VenueSource;
  externalId?: string;
  createdAt: string;
}

export interface OutingStop {
  id: string;
  outingId: string;
  venueId: string;
  arrivedAt: string;
  departedAt?: string;
  orderIndex: number;
}

export type NearbyVenue = {
  venue: Venue;
  distanceMeters: number;
};

export function venueDistanceFromPoint(venue: Venue, point: LocationPoint) {
  return distanceBetweenPoints(
    { latitude: venue.latitude, longitude: venue.longitude, timestamp: 0 },
    { latitude: point.latitude, longitude: point.longitude, timestamp: 0 },
  );
}

export function formatVenueDistance(distanceMeters: number) {
  if (distanceMeters < 1000) return `${Math.round(distanceMeters)} m`;
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

export function formatStopDuration(arrivedAt: string, departedAt?: string) {
  const end = departedAt ? new Date(departedAt).getTime() : Date.now();
  const minutes = Math.max(0, Math.round((end - new Date(arrivedAt).getTime()) / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;
}
