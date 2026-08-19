import type { DrinkEntry } from '@/domain/drinks';
import type { Outing } from '@/domain/outings';
import type { LocationPoint } from '@/services/location/types';

export type CompletedOuting = {
  outing: Outing;
  drinks: DrinkEntry[];
  routePoints: LocationPoint[];
};

export type OutingSessionSnapshotV1 = {
  version: 1;
  activeOuting: Outing | null;
  drinks: DrinkEntry[];
  lastFinishedOuting: {
    outing: Outing;
    drinks: DrinkEntry[];
  } | null;
};

export type OutingSessionSnapshotV2 = {
  version: 2;
  activeOuting: Outing | null;
  drinks: DrinkEntry[];
  routePoints: LocationPoint[];
  lastFinishedOuting: CompletedOuting | null;
};
