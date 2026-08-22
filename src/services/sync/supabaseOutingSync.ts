import type { CompletedOuting } from '@/features/outing/types';
import { supabase } from '@/lib/supabase';

function venueRows(snapshot: CompletedOuting, userId: string) {
  return snapshot.venues.map((venue) => ({
    id: venue.id,
    creator_id: userId,
    name: venue.name,
    latitude: venue.latitude,
    longitude: venue.longitude,
    address: venue.address ?? null,
    category: venue.category,
    source: venue.source,
    external_id: venue.externalId ?? null,
    created_at: venue.createdAt,
  }));
}

function outingRow(snapshot: CompletedOuting, userId: string) {
  const outing = snapshot.outing;
  return {
    id: outing.id,
    owner_id: userId,
    title: outing.title ?? null,
    description: outing.description ?? null,
    started_at: outing.startedAt,
    ended_at: outing.endedAt ?? null,
    status: outing.status,
    city: outing.city ?? null,
    current_venue_id: outing.currentVenueId ?? null,
    distance_meters: outing.distanceMeters,
    visibility: outing.visibility,
    drink_visibility: outing.drinkVisibility,
    map_visibility: outing.mapVisibility,
    created_at: outing.createdAt,
    updated_at: outing.updatedAt,
  };
}

export async function syncCompletedOuting(snapshot: CompletedOuting, userId: string) {
  const venues = venueRows(snapshot, userId);
  if (venues.length > 0) {
    const { error } = await supabase
      .from('venues')
      .upsert(venues, { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw error;
  }

  const { error: outingError } = await supabase
    .from('outings')
    .upsert(outingRow(snapshot, userId), { onConflict: 'id' });
  if (outingError) throw outingError;

  if (snapshot.stops.length > 0) {
    const { error } = await supabase.from('outing_stops').upsert(
      snapshot.stops.map((stop) => ({
        id: stop.id,
        outing_id: stop.outingId,
        venue_id: stop.venueId,
        arrived_at: stop.arrivedAt,
        departed_at: stop.departedAt ?? null,
        order_index: stop.orderIndex,
      })),
      { onConflict: 'id' },
    );
    if (error) throw error;
  }

  if (snapshot.drinks.length > 0) {
    const { error } = await supabase.from('drinks').upsert(
      snapshot.drinks.map((drink) => ({
        id: drink.id,
        user_id: userId,
        outing_id: drink.outingId,
        venue_id: drink.venueId ?? null,
        type: drink.type,
        beer_size: drink.beerSize ?? null,
        subtype: drink.subtype ?? null,
        notes: drink.notes ?? null,
        consumed_at: drink.timestamp,
        latitude: drink.latitude ?? null,
        longitude: drink.longitude ?? null,
        created_at: drink.createdAt,
        updated_at: drink.updatedAt,
      })),
      { onConflict: 'id' },
    );
    if (error) throw error;
  }

  const { error: deleteRouteError } = await supabase
    .from('route_points')
    .delete()
    .eq('outing_id', snapshot.outing.id);
  if (deleteRouteError) throw deleteRouteError;

  if (snapshot.routePoints.length > 0) {
    const { error } = await supabase.from('route_points').insert(
      snapshot.routePoints.map((point, pointIndex) => ({
        outing_id: snapshot.outing.id,
        user_id: userId,
        point_index: pointIndex,
        latitude: point.latitude,
        longitude: point.longitude,
        accuracy: point.accuracy ?? null,
        altitude: point.altitude ?? null,
        speed: point.speed ?? null,
        recorded_at: new Date(point.timestamp).toISOString(),
      })),
    );
    if (error) throw error;
  }
}
