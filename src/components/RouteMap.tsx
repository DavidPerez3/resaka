import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

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

type DrawablePoint = { x: number; y: number };

function projectCoordinates(points: Array<{ latitude: number; longitude: number }>): DrawablePoint[] {
  if (points.length === 0) return [];
  const minLat = Math.min(...points.map((point) => point.latitude));
  const maxLat = Math.max(...points.map((point) => point.latitude));
  const minLon = Math.min(...points.map((point) => point.longitude));
  const maxLon = Math.max(...points.map((point) => point.longitude));
  const latRange = Math.max(maxLat - minLat, 0.000001);
  const lonRange = Math.max(maxLon - minLon, 0.000001);

  return points.map((point) => ({
    x: 8 + ((point.longitude - minLon) / lonRange) * 84,
    y: 8 + (1 - (point.latitude - minLat) / latRange) * 64,
  }));
}

export function RouteMap({ points, drinkClusters, height = 220, endLabel = 'Última posición' }: RouteMapProps) {
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

  const route = useMemo(() => projectCoordinates(points), [points]);
  const showDetails = !activeOuting && resolvedDrinkClusters.length > 0;

  if (route.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyIcon}>📍</Text>
        <Text style={styles.emptyTitle}>Esperando señal GPS</Text>
        <Text style={styles.emptyText}>En cuanto tengamos una posición fiable aparecerá aquí.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={[styles.frame, { height }]}>
        <Svg width="100%" height="100%" viewBox="0 0 100 80">
          {[20, 40, 60, 80].map((value) => (
            <Line key={`v-${value}`} x1={value} y1="0" x2={value} y2="80" stroke="#252B37" strokeWidth="0.35" />
          ))}
          {[16, 32, 48, 64].map((value) => (
            <Line key={`h-${value}`} x1="0" y1={value} x2="100" y2={value} stroke="#252B37" strokeWidth="0.35" />
          ))}
          {route.length > 1 ? (
            <Polyline
              points={route.map((point) => `${point.x},${point.y}`).join(' ')}
              fill="none"
              stroke={colors.accent}
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
          <Circle cx={route[0].x} cy={route[0].y} r="2.2" fill={colors.success} stroke="#fff" strokeWidth="0.7" />
          {route.length > 1 ? (
            <Circle cx={route.at(-1)?.x} cy={route.at(-1)?.y} r="2.2" fill={colors.accent} stroke="#fff" strokeWidth="0.7" />
          ) : null}
        </Svg>

        <View style={styles.legend}>
          <Text style={styles.legendText}>● Inicio</Text>
          {route.length > 1 ? <Text style={styles.legendText}>● {endLabel}</Text> : null}
          {sourceStops.length > 0 ? <Text style={styles.legendText}>📍 {sourceStops.length} garitos</Text> : null}
          {resolvedDrinkClusters.length > 0 ? (
            <Text style={styles.legendText}>
              {resolvedDrinkClusters.flatMap(buildDrinkClusterTokens).slice(0, 4).join(' ')}
            </Text>
          ) : null}
        </View>
        <Text style={styles.safeMapLabel}>RECORRIDO GPS</Text>
      </View>
      {showDetails ? <DrinkMapDetails clusters={resolvedDrinkClusters} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 13 },
  frame: { overflow: 'hidden', borderRadius: 22, backgroundColor: '#111620', borderWidth: 1, borderColor: colors.border },
  legend: { position: 'absolute', top: 10, left: 10, right: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 9, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 13, backgroundColor: 'rgba(11,13,18,0.88)' },
  legendText: { color: colors.text, fontSize: 9, fontWeight: '800' },
  safeMapLabel: { position: 'absolute', right: 12, bottom: 10, color: colors.textMuted, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  emptyIcon: { fontSize: 30 },
  emptyTitle: { marginTop: 10, color: colors.text, fontSize: 16, fontWeight: '900' },
  emptyText: { marginTop: 4, maxWidth: 280, color: colors.textMuted, fontSize: 12, lineHeight: 17, textAlign: 'center' },
});

