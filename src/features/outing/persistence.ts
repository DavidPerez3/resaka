import type { DrinkEntry } from '@/domain/drinks';
import type { Outing } from '@/domain/outings';
import type { CompletedOuting, OutingSessionSnapshotV1 } from '@/features/outing/types';

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

function sanitizeCompletedOuting(value: unknown): CompletedOuting | null {
  if (!isRecord(value) || !isOuting(value.outing, 'FINISHED')) return null;

  return {
    outing: value.outing,
    drinks: sanitizeDrinks(value.drinks, value.outing.id),
  };
}

export function createOutingSessionSnapshot(input: {
  activeOuting: Outing | null;
  drinks: DrinkEntry[];
  lastFinishedOuting: CompletedOuting | null;
}): OutingSessionSnapshotV1 {
  return {
    version: 1,
    activeOuting: input.activeOuting,
    drinks: input.activeOuting
      ? input.drinks.filter((drink) => drink.outingId === input.activeOuting?.id)
      : [],
    lastFinishedOuting: input.lastFinishedOuting,
  };
}

export function restoreOutingSessionSnapshot(value: unknown): OutingSessionSnapshotV1 {
  const empty: OutingSessionSnapshotV1 = {
    version: 1,
    activeOuting: null,
    drinks: [],
    lastFinishedOuting: null,
  };

  if (!isRecord(value) || value.version !== 1) return empty;

  const activeOuting = isOuting(value.activeOuting, 'ACTIVE') ? value.activeOuting : null;
  return {
    version: 1,
    activeOuting,
    drinks: activeOuting ? sanitizeDrinks(value.drinks, activeOuting.id) : [],
    lastFinishedOuting: sanitizeCompletedOuting(value.lastFinishedOuting),
  };
}
