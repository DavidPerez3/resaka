import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { LocationPoint } from '@/services/location/types';
import { colors } from '@/theme/colors';

type RouteMapProps = {
  points: LocationPoint[];
  height?: number;
  endLabel?: string;
};

function escapeJsonForHtml(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function buildMapHtml(points: LocationPoint[], endLabel: string) {
  const coordinates = points.map((point) => [point.latitude, point.longitude]);
  const safeCoordinates = escapeJsonForHtml(coordinates);
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
    .legend{position:absolute;z-index:999;top:10px;left:10px;display:flex;gap:10px;padding:7px 10px;border-radius:13px;background:rgba(11,13,18,.86);color:#F7F2E8;font:800 10px system-ui,-apple-system,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.22)}
    .legend-item{display:flex;align-items:center;gap:5px;white-space:nowrap}
    .dot{width:9px;height:9px;border-radius:50%}
    .start{background:#4CAF78}
    .end{background:#E84A5F}
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="legend" class="legend"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const points = ${safeCoordinates};
    const endLabel = ${safeEndLabel};
    const legend = document.getElementById('legend');
    legend.innerHTML = '<div class="legend-item"><span class="dot start"></span><span>Inicio</span></div>' +
      (points.length > 1 ? '<div class="legend-item"><span class="dot end"></span><span>' + endLabel + '</span></div>' : '');

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
  </script>
</body>
</html>`;
}

export function RouteMap({ points, height = 220, endLabel = 'Última posición' }: RouteMapProps) {
  const srcDoc = useMemo(() => buildMapHtml(points, endLabel), [endLabel, points]);

  if (points.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyIcon}>📍</Text>
        <Text style={styles.emptyTitle}>Esperando señal GPS</Text>
        <Text style={styles.emptyText}>En cuanto tengamos una posición fiable aparecerá aquí.</Text>
      </View>
    );
  }

  return (
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
