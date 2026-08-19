import type { DrinkEntry } from '@/domain/drinks';
import type { Outing } from '@/domain/outings';
import type { OutingStop, Venue } from '@/domain/venues';
import type { LocationPoint } from '@/services/location/types';

export type CompletedOuting = {
  outing: Outing;
  drinks: DrinkEntry[];
  routePoints: LocationPoint[];
  stops: OutingStop[];
  venues: Venue[];
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
  lastFinishedOuting: {
    outing: Outing;
    drinks: DrinkEntry[];
    routePoints: LocationPoint[];
  } | null;
};

export type OutingSessionSnapshotV3 = {
  version: 3;
  activeOuting: Outing | null;
  drinks: DrinkEntry[];
  routePoints: LocationPoint[];
  lastFinishedOuting: {
    outing: Outing;
    drinks: DrinkEntry[];
    routePoints: LocationPoint[];
  } | null;
  showCompletionSummary: boolean;
};

export type OutingSessionSnapshotV4 = {
  version: 4;
  activeOuting: Outing | null;
  drinks: DrinkEntry[];
  routePoints: LocationPoint[];
  stops: OutingStop[];
  knownVenues: Venue[];
  lastFinishedOuting: CompletedOuting | null;
  showCompletionSummary: boolean;
};
