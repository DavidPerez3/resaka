import type { DrinkEntry } from '@/domain/drinks';
import type { Outing } from '@/domain/outings';

export type CompletedOuting = {
  outing: Outing;
  drinks: DrinkEntry[];
};

export type OutingSessionSnapshotV1 = {
  version: 1;
  activeOuting: Outing | null;
  drinks: DrinkEntry[];
  lastFinishedOuting: CompletedOuting | null;
};
