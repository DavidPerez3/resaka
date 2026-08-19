import type { DrinkEntry } from '@/domain/drinks';
import type { Outing } from '@/domain/outings';
import { calculateRouteDistance, isValidLocationPoint } from '@/domain/route';
import type { OutingStop, Venue } from '@/domain/venues';
import type {
  CompletedOuting,
  OutingSessionSnapshotV1,
  OutingSessionSnapshotV2,
  OutingSessionSnapshotV3,
  OutingSessionSnapshotV4,
} from '@/features/outing/types';
import type { LocationPoint } from '@/services/location/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOuting(value: unknown, expectedStatus?: Outing['status']): value is Outing {
  if (!isRecord(value)) return false;

  const status = value.status;
  const validStatus = status === 'ACTIVE' || status === 'FINISHED' || status === 'CANCELLED';
  if (!validStatus) return false;
  if (expectedStatus && status !== expectedStatus) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.ownerId === 'string' &&
    typeof value.startedAt === 'string' &&
    typeof value.distanceMeters === 'number' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function isDrink(value: unknown): value is DrinkEntry {
  if (!isRecord(value)) return false;

  const type = value.type;
  const validType =
    type === 'BEER' || type === 'KALIMOTXO' || type === 'SHOT' || type === 'MIXED_DRINK';
  if (!validType) return false;

  if (type === 'BEER') {
    const size = value.beerSize;
    if (size !== 'QUINTO' && size !== 'TERCIO' && size !== 'LITRONA') return false;
  } else if (value.beerSize !== undefined) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.userId === 'string' &&
    typeof value.outingId === 'string' &&
    typeof value.timestamp === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function isVenue(value: unknown): value is Venue {
  if (!isRecord(value)) return false;
  const validSource = value.source === 'OSM' || value.source === 'MANUAL';
  const validCategory =
    value.category === 'BAR' ||
    value.category === 'PUB' ||
    value.category === 'NIGHTCLUB' ||
    value.category === 'BIERGARTEN' ||
    value.category === 'OTHER';

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    typeof value.latitude === 'number' &&
    Number.isFinite(value.latitude) &&
    typeof value.longitude === 'number' &&
    Number.isFinite(value.longitude) &&
    validSource &&
    validCategory &&
    typeof value.createdAt === 'string'
  );
}

function isStop(value: unknown, outingId: string): value is OutingStop {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    value.outingId === outingId &&
    typeof value.venueId === 'string' &&
    typeof value.arrivedAt === 'string' &&
    (value.departedAt === undefined || typeof value.departedAt === 'string') &&
    typeof value.orderIndex === 'number' &&
    Number.isFinite(value.orderIndex)
  );
}

function sanitizeDrinks(value: unknown, outingId: string) {
  if (!Array.isArray(value)) return [];
  return value.filter((drink): drink is DrinkEntry => isDrink(drink) && drink.outingId === outingId);
}

function sanitizeRoutePoints(value: unknown): LocationPoint[] {
  if (!Array.isArray(value)) return [];

  return value.filter((point): point is LocationPoint => {
    if (!isRecord(point)) return false;

    const locationPoint: LocationPoint = {
      latitude: point.latitude as number,
      longitude: point.longitude as number,
      timestamp: point.timestamp as number,
      accuracy: typeof point.accuracy === 'number' ? point.accuracy : undefined,
      altitude: typeof point.altitude === 'number' ? point.altitude : undefined,
      speed: typeof point.speed === 'number' ? point.speed : undefined,
    };

    return isValidLocationPoint(locationPoint);
  });
}

function sanitizeVenues(value: unknown): Venue[] {
  if (!Array.isArray(value)) return [];
  const unique = new Map<string, Venue>();
  for (const venue of value) {
    if (isVenue(venue)) unique.set(venue.id, venue);
  }
  return Array.from(unique.values());
}

function sanitizeStops(value: unknown, outingId: string): OutingStop[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((stop): stop is OutingStop => isStop(stop, outingId))
    .sort((left, right) => left.orderIndex - right.orderIndex);
}

function withRouteDistance(outing: Outing, routePoints: LocationPoint[]): Outing {
  return {
    ...outing,
    distanceMeters: calculateRouteDistance(routePoints),
  };
}

function sanitizeCompletedOuting(value: unknown, legacyRoute = false): CompletedOuting | null {
  if (!isRecord(value) || !isOuting(value.outing, 'FINISHED')) return null;

  const routePoints = legacyRoute ? [] : sanitizeRoutePoints(value.routePoints);
  return {
    outing: withRouteDistance(value.outing, routePoints),
    drinks: sanitizeDrinks(value.drinks, value.outing.id),
    routePoints,
    stops: sanitizeStops(value.stops, value.outing.id),
    venues: sanitizeVenues(value.venues),
  };
}

export function createOutingSessionSnapshot(input: {
  activeOuting: Outing | null;
  drinks: DrinkEntry[];
  routePoints: LocationPoint[];
  stops: OutingStop[];
  knownVenues: Venue[];
  lastFinishedOuting: CompletedOuting | null;
  showCompletionSummary: boolean;
}): OutingSessionSnapshotV4 {
  return {
    version: 4,
    activeOuting: input.activeOuting,
    drinks: input.activeOuting
      ? input.drinks.filter((drink) => drink.outingId === input.activeOuting?.id)
      : [],
    routePoints: input.activeOuting ? input.routePoints : [],
    stops: input.activeOuting
      ? input.stops.filter((stop) => stop.outingId === input.activeOuting?.id)
      : [],
    knownVenues: input.knownVenues,
    lastFinishedOuting: input.lastFinishedOuting,
    showCompletionSummary: input.showCompletionSummary && Boolean(input.lastFinishedOuting),
  };
}

function restoreLegacy(value: Record<string, unknown>, version: 1 | 2 | 3): OutingSessionSnapshotV4 {
  const routePoints = version === 1 ? [] : sanitizeRoutePoints(value.routePoints);
  const activeOuting = isOuting(value.activeOuting, 'ACTIVE')
    ? withRouteDistance(value.activeOuting, routePoints)
    : null;
  const lastFinishedOuting = sanitizeCompletedOuting(value.lastFinishedOuting, version === 1);

  return {
    version: 4,
    activeOuting,
    drinks: activeOuting ? sanitizeDrinks(value.drinks, activeOuting.id) : [],
    routePoints: activeOuting ? routePoints : [],
    stops: [],
    knownVenues: [],
    lastFinishedOuting,
    showCompletionSummary:
      version === 3 && value.showCompletionSummary === true && Boolean(lastFinishedOuting),
  };
}

export function restoreOutingSessionSnapshot(value: unknown): OutingSessionSnapshotV4 {
  const empty: OutingSessionSnapshotV4 = {
    version: 4,
    activeOuting: null,
    drinks: [],
    routePoints: [],
    stops: [],
    knownVenues: [],
    lastFinishedOuting: null,
    showCompletionSummary: false,
  };

  if (!isRecord(value)) return empty;
  if (value.version === 1) return restoreLegacy(value as OutingSessionSnapshotV1 & Record<string, unknown>, 1);
  if (value.version === 2) return restoreLegacy(value as OutingSessionSnapshotV2 & Record<string, unknown>, 2);
  if (value.version === 3) return restoreLegacy(value as OutingSessionSnapshotV3 & Record<string, unknown>, 3);
  if (value.version !== 4) return empty;

  const routePoints = sanitizeRoutePoints(value.routePoints);
  const knownVenues = sanitizeVenues(value.knownVenues);
  const activeOuting = isOuting(value.activeOuting, 'ACTIVE')
    ? withRouteDistance(value.activeOuting, routePoints)
    : null;
  const lastFinishedOuting = sanitizeCompletedOuting(value.lastFinishedOuting);

  return {
    version: 4,
    activeOuting,
    drinks: activeOuting ? sanitizeDrinks(value.drinks, activeOuting.id) : [],
    routePoints: activeOuting ? routePoints : [],
    stops: activeOuting ? sanitizeStops(value.stops, activeOuting.id) : [],
    knownVenues,
    lastFinishedOuting,
    showCompletionSummary:
      value.showCompletionSummary === true && Boolean(lastFinishedOuting),
  };
}
