import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import type { LocationPoint } from '@/services/location/types';
import { colors } from '@/theme/colors';

type RouteMapProps = {
  points: LocationPoint[];
  height?: number;
};

export function RouteMap({ points, height = 220 }: RouteMapProps) {
  const mapRef = useRef<MapView | null>(null);

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

  return (
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
        <Marker coordinate={first} title="Inicio" pinColor={colors.success} />
        {coordinates.length > 1 ? <Marker coordinate={last} title="Ahora" pinColor={colors.accent} /> : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    borderRadius: 22,
    backgroundColor: colors.surface,
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
