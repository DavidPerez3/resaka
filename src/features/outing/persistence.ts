import type { DrinkEntry } from '@/domain/drinks';
import type { Outing } from '@/domain/outings';
import { calculateRouteDistance, isValidLocationPoint } from '@/domain/route';
import type {
  CompletedOuting,
  OutingSessionSnapshotV1,
  OutingSessionSnapshotV2,
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

function withRouteDistance(outing: Outing, routePoints: LocationPoint[]): Outing {
  return {
    ...outing,
    distanceMeters: calculateRouteDistance(routePoints),
  };
}

function sanitizeCompletedOuting(value: unknown, legacy = false): CompletedOuting | null {
  if (!isRecord(value) || !isOuting(value.outing, 'FINISHED')) return null;

  const routePoints = legacy ? [] : sanitizeRoutePoints(value.routePoints);
  return {
    outing: withRouteDistance(value.outing, routePoints),
    drinks: sanitizeDrinks(value.drinks, value.outing.id),
    routePoints,
  };
}

export function createOutingSessionSnapshot(input: {
  activeOuting: Outing | null;
  drinks: DrinkEntry[];
  routePoints: LocationPoint[];
  lastFinishedOuting: CompletedOuting | null;
}): OutingSessionSnapshotV2 {
  return {
    version: 2,
    activeOuting: input.activeOuting,
    drinks: input.activeOuting
      ? input.drinks.filter((drink) => drink.outingId === input.activeOuting?.id)
      : [],
    routePoints: input.activeOuting ? input.routePoints : [],
    lastFinishedOuting: input.lastFinishedOuting,
  };
}

function restoreV1(value: Record<string, unknown>): OutingSessionSnapshotV2 {
  const activeOuting = isOuting(value.activeOuting, 'ACTIVE') ? value.activeOuting : null;
  const legacyLastFinished = sanitizeCompletedOuting(value.lastFinishedOuting, true);

  return {
    version: 2,
    activeOuting: activeOuting ? withRouteDistance(activeOuting, []) : null,
    drinks: activeOuting ? sanitizeDrinks(value.drinks, activeOuting.id) : [],
    routePoints: [],
    lastFinishedOuting: legacyLastFinished,
  };
}

export function restoreOutingSessionSnapshot(value: unknown): OutingSessionSnapshotV2 {
  const empty: OutingSessionSnapshotV2 = {
    version: 2,
    activeOuting: null,
    drinks: [],
    routePoints: [],
    lastFinishedOuting: null,
  };

  if (!isRecord(value)) return empty;
  if (value.version === 1) return restoreV1(value as OutingSessionSnapshotV1 & Record<string, unknown>);
  if (value.version !== 2) return empty;

  const routePoints = sanitizeRoutePoints(value.routePoints);
  const activeOuting = isOuting(value.activeOuting, 'ACTIVE')
    ? withRouteDistance(value.activeOuting, routePoints)
    : null;

  return {
    version: 2,
    activeOuting,
    drinks: activeOuting ? sanitizeDrinks(value.drinks, activeOuting.id) : [],
    routePoints: activeOuting ? routePoints : [],
    lastFinishedOuting: sanitizeCompletedOuting(value.lastFinishedOuting),
  };
}
