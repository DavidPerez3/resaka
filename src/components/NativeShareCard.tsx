import { forwardRef, useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import type { CompletedOuting } from '@/features/outing/types';
import type { ShareCardOptions } from '@/features/sharing/shareOuting';

type NativeShareCardProps = {
  completed: CompletedOuting;
  options: ShareCardOptions;
};

function formatDuration(startedAt: string, endedAt?: string) {
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const minutes = Math.max(0, Math.floor((end - new Date(startedAt).getTime()) / 60_000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours} h ${String(rest).padStart(2, '0')} min` : `${minutes} min`;
}

function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1_000) return `${Math.round(distanceMeters)} m`;
  return `${(distanceMeters / 1_000).toFixed(2).replace('.', ',')} km`;
}

function formatDate(timestamp: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(new Date(timestamp))
    .replace('.', '')
    .toUpperCase();
}

function buildRoutePoints(completed: CompletedOuting) {
  const points = completed.routePoints;
  if (points.length < 2) return [];

  const minLat = Math.min(...points.map((point) => point.latitude));
  const maxLat = Math.max(...points.map((point) => point.latitude));
  const minLon = Math.min(...points.map((point) => point.longitude));
  const maxLon = Math.max(...points.map((point) => point.longitude));
  const latRange = Math.max(maxLat - minLat, 0.000001);
  const lonRange = Math.max(maxLon - minLon, 0.000001);

  return points.map((point) => ({
    x: 8 + ((point.longitude - minLon) / lonRange) * 84,
    y: 8 + (1 - (point.latitude - minLat) / latRange) * 44,
  }));
}

export const NativeShareCard = forwardRef<View, NativeShareCardProps>(
  function NativeShareCard({ completed, options }, ref) {
    const route = useMemo(() => buildRoutePoints(completed), [completed]);
    const venueNames = useMemo(() => {
      const byId = new Map(completed.venues.map((venue) => [venue.id, venue.name]));
      return completed.stops
        .map((stop) => byId.get(stop.venueId))
        .filter((name, index, all): name is string => Boolean(name) && all.indexOf(name) === index);
    }, [completed]);
    const counts = useMemo(
      () => ({
        beer: completed.drinks.filter((drink) => drink.type === 'BEER').length,
        kalimotxo: completed.drinks.filter((drink) => drink.type === 'KALIMOTXO').length,
        shot: completed.drinks.filter((drink) => drink.type === 'SHOT').length,
        mixed: completed.drinks.filter((drink) => drink.type === 'MIXED_DRINK').length,
      }),
      [completed.drinks],
    );

    return (
      <View ref={ref} collapsable={false} style={styles.card}>
        {options.backgroundPhotoDataUrl ? (
          <Image source={{ uri: options.backgroundPhotoDataUrl }} resizeMode="cover" style={StyleSheet.absoluteFill} />
        ) : null}
        <View style={[StyleSheet.absoluteFill, styles.shade]} />

        <View>
          <Text style={styles.brand}>RESAKA</Text>
          <Text style={styles.tagline}>Los datos que no recordabas.</Text>
        </View>

        <View style={styles.headlineBlock}>
          <Text style={styles.eyebrow}>SALIDA REGISTRADA</Text>
          <Text style={styles.headline}>Toda noche{`\n`}deja rastro.</Text>
          <Text style={styles.date}>{formatDate(completed.outing.startedAt)}</Text>
        </View>

        {options.showRoute ? (
          <View style={styles.routeCard}>
            <Text style={styles.sectionLabel}>RUTA DE LA NOCHE</Text>
            {route.length > 1 ? (
              <Svg width="100%" height="100%" viewBox="0 0 100 60" style={styles.routeSvg}>
                <Polyline
                  points={route.map((point) => `${point.x},${point.y}`).join(' ')}
                  fill="none"
                  stroke="#E84A5F"
                  strokeWidth="2.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle cx={route[0].x} cy={route[0].y} r="2.1" fill="#4CAF78" stroke="#FFFFFF" strokeWidth="0.8" />
                <Circle cx={route.at(-1)?.x} cy={route.at(-1)?.y} r="2.1" fill="#E84A5F" stroke="#FFFFFF" strokeWidth="0.8" />
              </Svg>
            ) : (
              <Text style={styles.noRoute}>Sin recorrido GPS registrado</Text>
            )}
          </View>
        ) : (
          <View style={styles.routeSpacer} />
        )}

        <View style={styles.bottomBlock}>
          <View style={styles.statsCard}>
            <CardStat label="DURACIÓN" value={formatDuration(completed.outing.startedAt, completed.outing.endedAt)} />
            <CardStat label="DISTANCIA" value={formatDistance(completed.outing.distanceMeters)} />
            {options.showVenues ? <CardStat label="GARITOS" value={String(completed.stops.length)} /> : null}
          </View>

          {options.showDrinks ? (
            <View>
              <Text style={styles.sectionLabel}>INVENTARIO · {completed.drinks.length} BEBIDAS</Text>
              <Text style={styles.detail}>🍺 {counts.beer}   🍷 {counts.kalimotxo}   🥃 {counts.shot}   🍸 {counts.mixed}</Text>
            </View>
          ) : null}

          {options.showVenues && venueNames.length > 0 ? (
            <View>
              <Text style={styles.sectionLabel}>GARITOS</Text>
              <Text style={styles.detail} numberOfLines={2}>{venueNames.slice(0, 4).join(' · ')}</Text>
            </View>
          ) : null}

          <Text style={styles.hashtag}>#RESAKA</Text>
        </View>
      </View>
    );
  },
);

function CardStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', aspectRatio: 9 / 16, padding: 12, gap: 6, overflow: 'hidden', backgroundColor: '#0B0D12' },
  shade: { backgroundColor: 'rgba(5, 6, 10, 0.62)' },
  brand: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', letterSpacing: 2.5 },
  tagline: { marginTop: 2, color: 'rgba(255,255,255,0.72)', fontSize: 7, fontWeight: '600' },
  headlineBlock: { marginTop: 2 },
  eyebrow: { color: '#E84A5F', fontSize: 7, fontWeight: '900', letterSpacing: 1.2 },
  headline: { marginTop: 4, color: '#FFFFFF', fontSize: 21, lineHeight: 22, fontWeight: '900' },
  date: { marginTop: 4, color: 'rgba(255,255,255,0.78)', fontSize: 8, fontWeight: '800' },
  routeCard: { flex: 1, minHeight: 64, padding: 8, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', backgroundColor: 'rgba(8,11,18,0.78)' },
  routeSvg: { flex: 1, marginTop: 2 },
  routeSpacer: { flex: 1, minHeight: 34 },
  noRoute: { flex: 1, textAlign: 'center', textAlignVertical: 'center', color: 'rgba(255,255,255,0.68)', fontSize: 8, fontWeight: '700' },
  bottomBlock: { gap: 5 },
  statsCard: { minHeight: 43, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 5, borderRadius: 11, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', backgroundColor: 'rgba(8,11,18,0.82)' },
  stat: { flex: 1 },
  statLabel: { color: 'rgba(255,255,255,0.62)', fontSize: 5, fontWeight: '900', letterSpacing: 0.5 },
  statValue: { marginTop: 3, color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  sectionLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 5.5, fontWeight: '900', letterSpacing: 0.7 },
  detail: { marginTop: 2, color: '#FFFFFF', fontSize: 7, lineHeight: 9, fontWeight: '800' },
  hashtag: { alignSelf: 'flex-end', color: '#E84A5F', fontSize: 7, fontWeight: '900' },
});
