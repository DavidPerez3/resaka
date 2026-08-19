import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

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

type VenueMarker = { id: string; latitude: number; longitude: number };

function escapeJsonForHtml(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function buildMapHtml(
  points: LocationPoint[],
  drinkClusters: DrinkMapCluster[],
  venueMarkers: VenueMarker[],
  endLabel: string,
) {
  const coordinates = points.map((point) => [point.latitude, point.longitude]);
  const drinkMarkers = drinkClusters.map((cluster) => ({
    latitude: cluster.latitude,
    longitude: cluster.longitude,
    tokens: buildDrinkClusterTokens(cluster),
  }));
  const safeCoordinates = escapeJsonForHtml(coordinates);
  const safeDrinkMarkers = escapeJsonForHtml(drinkMarkers);
  const safeVenueMarkers = escapeJsonForHtml(venueMarkers);
  const safeEndLabel = escapeJsonForHtml(endLabel);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html,body,#map{height:100%;width:100%;margin:0;background:#151922;overflow:hidden}
    .leaflet-container{background:#151922;font-family:system-ui,-apple-system,sans-serif}
    .leaflet-control-attribution{font-size:9px;background:rgba(21,25,34,.8)!important;color:#a7adba!important}
    .leaflet-control-attribution a{color:#e84a5f!important}
    .legend{position:absolute;z-index:999;top:10px;left:10px;display:flex;flex-wrap:wrap;gap:10px;padding:7px 10px;border-radius:13px;background:rgba(11,13,18,.86);color:#F7F2E8;font:800 10px system-ui,-apple-system,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.22)}
    .legend-item{display:flex;align-items:center;gap:5px;white-space:nowrap}
    .dot{width:9px;height:9px;border-radius:50%}
    .start{background:#4CAF78}
    .end{background:#E84A5F}
    .drink-marker{box-sizing:border-box;height:38px;display:flex;align-items:center;justify-content:center;gap:7px;padding:0 10px;border-radius:19px;background:rgba(11,13,18,.95);border:2px solid #F7F2E8;color:#F7F2E8;box-shadow:0 3px 10px rgba(0,0,0,.28);white-space:nowrap;overflow:hidden}
    .drink-token{display:inline-flex;align-items:center;justify-content:center;min-width:26px;font:900 15px/1 system-ui,-apple-system,sans-serif;white-space:nowrap}
    .venue-marker{width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:15px;background:rgba(11,13,18,.94);border:2px solid #E84A5F;font-size:16px;box-shadow:0 3px 10px rgba(0,0,0,.25)}
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="legend" class="legend"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const points = ${safeCoordinates};
    const drinks = ${safeDrinkMarkers};
    const venues = ${safeVenueMarkers};
    const endLabel = ${safeEndLabel};
    const legend = document.getElementById('legend');
    legend.innerHTML = '<div class="legend-item"><span class="dot start"></span><span>Inicio</span></div>' +
      (points.length > 1 ? '<div class="legend-item"><span class="dot end"></span><span>' + endLabel + '</span></div>' : '') +
      (venues.length > 0 ? '<div class="legend-item"><span>📍</span><span>Garito</span></div>' : '') +
      (drinks.length > 0 ? '<div class="legend-item"><span>🍺</span><span>Consumición</span></div>' : '');

    const map = L.map('map', { zoomControl: false, attributionControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    if (points.length === 1) {
      map.setView(points[0], 17);
      L.circleMarker(points[0], {radius:7,color:'#4CAF78',fillColor:'#4CAF78',fillOpacity:1,weight:3}).addTo(map);
    } else if (points.length > 1) {
      const route = L.polyline(points, {color:'#E84A5F',weight:5,opacity:.95,lineJoin:'round'}).addTo(map);
      L.circleMarker(points[0], {radius:6,color:'#4CAF78',fillColor:'#4CAF78',fillOpacity:1,weight:3}).addTo(map);
      L.circleMarker(points[points.length-1], {radius:7,color:'#E84A5F',fillColor:'#E84A5F',fillOpacity:1,weight:3}).addTo(map);
      map.fitBounds(route.getBounds(), {padding:[30,30],maxZoom:17});
    }

    venues.forEach((venue) => {
      const icon = L.divIcon({
        className: '',
        html: '<div class="venue-marker">📍</div>',
        iconSize: [30,30],
        iconAnchor: [15,15]
      });
      L.marker([venue.latitude, venue.longitude], { icon, interactive: false }).addTo(map);
    });

    drinks.forEach((drink) => {
      const tokenCount = Math.max(1, drink.tokens.length);
      const width = Math.min(190, 20 + tokenCount * 38);
      const tokenHtml = drink.tokens
        .map((token) => '<span class="drink-token">' + token + '</span>')
        .join('');
      const icon = L.divIcon({
        className: '',
        html: '<div class="drink-marker" style="width:' + width + 'px">' + tokenHtml + '</div>',
        iconSize: [width, 38],
        iconAnchor: [width / 2, 19]
      });
      L.marker([drink.latitude, drink.longitude], { icon, interactive: false }).addTo(map);
    });
  </script>
</body>
</html>`;
}

export function RouteMap({
  points,
  drinkClusters,
  height = 220,
  endLabel = 'Última posición',
}: RouteMapProps) {
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
    const unique = new Map<string, VenueMarker>();
    for (const stop of sourceStops) {
      const venue = venueById.get(stop.venueId);
      if (venue) {
        unique.set(venue.id, {
          id: venue.id,
          latitude: venue.latitude,
          longitude: venue.longitude,
        });
      }
    }
    return Array.from(unique.values());
  }, [sourceStops, sourceVenues]);

  const srcDoc = useMemo(
    () => buildMapHtml(points, resolvedDrinkClusters, venueMarkers, endLabel),
    [endLabel, points, resolvedDrinkClusters, venueMarkers],
  );

  if (points.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyIcon}>📍</Text>
        <Text style={styles.emptyTitle}>Esperando señal GPS</Text>
        <Text style={styles.emptyText}>En cuanto tengamos una posición fiable aparecerá aquí.</Text>
      </View>
    );
  }

  const showDetails = !activeOuting && resolvedDrinkClusters.length > 0;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.frame, { height }]} pointerEvents="none">
        {React.createElement('iframe', {
          title: 'Ruta de la salida',
          srcDoc,
          sandbox: 'allow-scripts',
          style: {
            width: '100%',
            height: '100%',
            border: 0,
            display: 'block',
            pointerEvents: 'none',
          },
        })}
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
