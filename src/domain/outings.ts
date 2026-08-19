export type OutingStatus = 'ACTIVE' | 'FINISHED' | 'CANCELLED';

export type OutingVisibility = 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';
export type DrinkVisibility = 'PUBLIC' | 'PARTICIPANTS' | 'PRIVATE';
export type MapVisibility = 'FULL' | 'HIDE_START_END' | 'PRIVATE';

export interface Outing {
  id: string;
  ownerId: string;
  title?: string;
  description?: string;
  startedAt: string;
  endedAt?: string;
  status: OutingStatus;
  city?: string;
  currentVenueId?: string;
  distanceMeters: number;
  visibility: OutingVisibility;
  drinkVisibility: DrinkVisibility;
  mapVisibility: MapVisibility;
  createdAt: string;
  updatedAt: string;
}
