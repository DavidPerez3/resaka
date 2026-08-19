import type { NearbyVenue } from '@/domain/venues';
import type { LocationPoint } from '@/services/location/types';

export interface VenueProvider {
  searchNearby(point: LocationPoint, radiusMeters?: number): Promise<NearbyVenue[]>;
}
