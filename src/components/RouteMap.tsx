import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { DrinkMapDetails } from '@/components/DrinkMapDetails';
import {
  buildDrinkClusterTokens,
  buildDrinkMapClusters,
  type DrinkMapCluster,
} from '@/domain/drinkMap';
import { useOutingSession } from '@/features/outing/OutingSessionContext';
import type { LocationPoint } from '@/services/location/types';
import { colors } from '@/theme/colors';

type RouteMapProps = {
  points: LocationPoint[];
  drinkClusters?: DrinkMapCluster[];
  height?: number;
  endLabel?: string;
};

export function RouteMap({
  points,
  drinkClusters,
  height = 220,
  endLabel = 'Última posición',
}: RouteMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const { activeOuting, drinks, stops, knownVenues, lastFinishedOuting } = useOutingSession();

  const sourceVenues = activeOuting ? knownVenues : (lastFinishedOuting?.venues ?? knownVenues);
  const sourceStops = activeOuting ? stops : (lastFinishedOuting?.stops ?? []);

  const resolvedDrinkClusters = useMemo(() => {
    if (drinkClusters) return drinkClusters;
    const sourceDrinks = activeOuting ? drinks : (lastFinishedOuting?.drinks ?? []);
    const venueById = new Map(sourceVenues.map((venue) => [venue.id, venue.name]));
    return buildDrinkMapClusters(
      sourceDrinks,
      (drink) => (drink.venueId ? venueById.get(drink.venueId) ?? 'Sin garito' : 'Sin garito'),
    );
  }, [activeOuting, drinkClusters, drinks, lastFinishedOuting, sourceVenues]);

  const venueMarkers = useMemo(() => {
    const venueById = new Map(sourceVenues.map((venue) => [venue.id, venue]));
    const unique = new Map<string, { id: string; name: string; latitude: number; longitude: number }>();
    for (const stop of sourceStops) {
      const venue = venueById.get(stop.venueId);
      if (venue) {
        unique.set(venue.id, {
          id: venue.id,
          name: venue.name,
          latitude: venue.latitude,
          longitude: venue.longitude,
        });
      }
    }
    return Array.from(unique.values());
  }, [sourceStops, sourceVenues]);

  const coordinates = useMemo(
    () => points.map((point) => ({ latitude: point.latitude, longitude: point.longitude })),
    [points],
  );

  useEffect(() => {
    if (coordinates.length === 0) return;

    const timeout = setTimeout(() => {
      if (coordinates.length === 1) {
        mapRef.current?.animateToRegion(
          {
            ...coordinates[0],
            latitudeDelta: 0.006,
            longitudeDelta: 0.006,
          },
          350,
        );
      } else {
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 44, right: 44, bottom: 44, left: 44 },
          animated: true,
        });
      }
    }, 120);

    return () => clearTimeout(timeout);
  }, [coordinates]);

  if (coordinates.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyIcon}>📍</Text>
        <Text style={styles.emptyTitle}>Esperando señal GPS</Text>
        <Text style={styles.emptyText}>En cuanto tengamos una posición fiable aparecerá aquí.</Text>
      </View>
    );
  }

  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  const showDetails = !activeOuting && resolvedDrinkClusters.length > 0;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.frame, { height }]} pointerEvents="none">
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            ...first,
            latitudeDelta: 0.006,
            longitudeDelta: 0.006,
          }}
          showsUserLocation
          showsMyLocationButton={false}
          toolbarEnabled={false}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
        >
          {coordinates.length > 1 ? (
            <Polyline coordinates={coordinates} strokeColor={colors.accent} strokeWidth={5} />
          ) : null}

          {venueMarkers.map((venue) => (
            <Marker
              key={`venue-${venue.id}`}
              coordinate={{ latitude: venue.latitude, longitude: venue.longitude }}
              title={venue.name}
              tracksViewChanges={false}
            >
              <View style={styles.venueMarker}>
                <Text style={styles.venueMarkerText}>📍</Text>
              </View>
            </Marker>
          ))}

          {resolvedDrinkClusters.map((cluster) => {
            const tokens = buildDrinkClusterTokens(cluster);
            return (
              <Marker
                key={cluster.id}
                coordinate={{ latitude: cluster.latitude, longitude: cluster.longitude }}
                tracksViewChanges={false}
              >
                <View style={styles.drinkMarker}>
                  {tokens.map((token) => (
                    <Text key={token} style={styles.drinkMarkerToken}>{token}</Text>
                  ))}
                </View>
              </Marker>
            );
          })}

          <Marker coordinate={first} title="Inicio" pinColor={colors.success} />
          {coordinates.length > 1 ? (
            <Marker coordinate={last} title={endLabel} pinColor={colors.accent} />
          ) : null}
        </MapView>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.startDot]} />
            <Text style={styles.legendText}>Inicio</Text>
          </View>
          {coordinates.length > 1 ? (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.endDot]} />
              <Text style={styles.legendText}>{endLabel}</Text>
            </View>
          ) : null}
          {venueMarkers.length > 0 ? (
            <View style={styles.legendItem}>
              <Text style={styles.legendDrink}>📍</Text>
              <Text style={styles.legendText}>Garito</Text>
            </View>
          ) : null}
          {resolvedDrinkClusters.length > 0 ? (
            <View style={styles.legendItem}>
              <Text style={styles.legendDrink}>🍺</Text>
              <Text style={styles.legendText}>Consumición</Text>
            </View>
          ) : null}
        </View>
      </View>

      {showDetails ? <DrinkMapDetails clusters={resolvedDrinkClusters} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 13 },
  frame: {
    overflow: 'hidden',
    borderRadius: 22,
    backgroundColor: colors.surface,
  },
  venueMarker: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: 'rgba(11,13,18,0.94)',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  venueMarkerText: { fontSize: 15 },
  drinkMarker: {
    minHeight: 38,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 19,
    backgroundColor: 'rgba(11,13,18,0.95)',
    borderWidth: 2,
    borderColor: colors.text,
  },
  drinkMarkerToken: {
    minWidth: 26,
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  legend: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 13,
    backgroundColor: 'rgba(11,13,18,0.86)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  startDot: { backgroundColor: colors.success },
  endDot: { backgroundColor: colors.accent },
  legendDrink: { fontSize: 11 },
  legendText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIcon: { fontSize: 30 },
  emptyTitle: { marginTop: 10, color: colors.text, fontSize: 16, fontWeight: '900' },
  emptyText: {
    marginTop: 4,
    maxWidth: 280,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
});
