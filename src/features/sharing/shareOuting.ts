import type { CompletedOuting } from '@/features/outing/types';

export type ShareCardOptions = {
  showRoute: boolean;
  showDrinks: boolean;
  showVenues: boolean;
};

export type ShareResult = 'shared' | 'downloaded';

const WIDTH = 1080;
const HEIGHT = 1920;

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function formatDuration(startedAt: string, endedAt?: string) {
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const minutes = Math.max(0, Math.floor((end - new Date(startedAt).getTime()) / 60000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours} h ${String(rest).padStart(2, '0')} min` : `${minutes} min`;
}

function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1000) return `${Math.round(distanceMeters)} m`;
  return `${(distanceMeters / 1000).toFixed(2).replace('.', ',')} km`;
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

function buildRoutePolyline(completed: CompletedOuting) {
  const points = completed.routePoints;
  if (points.length < 2) return '';

  const minLat = Math.min(...points.map((point) => point.latitude));
  const maxLat = Math.max(...points.map((point) => point.latitude));
  const minLon = Math.min(...points.map((point) => point.longitude));
  const maxLon = Math.max(...points.map((point) => point.longitude));
  const latRange = Math.max(maxLat - minLat, 0.000001);
  const lonRange = Math.max(maxLon - minLon, 0.000001);

  const left = 150;
  const top = 690;
  const boxWidth = 780;
  const boxHeight = 520;
  const padding = 36;

  return points
    .map((point) => {
      const x = left + padding + ((point.longitude - minLon) / lonRange) * (boxWidth - padding * 2);
      const y = top + padding + (1 - (point.latitude - minLat) / latRange) * (boxHeight - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function getVenueNames(completed: CompletedOuting) {
  const byId = new Map(completed.venues.map((venue) => [venue.id, venue.name]));
  const names: string[] = [];
  for (const stop of completed.stops) {
    const name = byId.get(stop.venueId);
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}

export function buildOutingShareSvg(completed: CompletedOuting, options: ShareCardOptions) {
  const { outing, drinks, stops } = completed;
  const route = options.showRoute ? buildRoutePolyline(completed) : '';
  const venues = options.showVenues ? getVenueNames(completed) : [];
  const beer = drinks.filter((drink) => drink.type === 'BEER').length;
  const kalimotxo = drinks.filter((drink) => drink.type === 'KALIMOTXO').length;
  const shot = drinks.filter((drink) => drink.type === 'SHOT').length;
  const mixed = drinks.filter((drink) => drink.type === 'MIXED_DRINK').length;
  const venueLine = venues.slice(0, 3).join(' · ');
  const extraVenues = Math.max(0, venues.length - 3);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#090b10"/>
      <stop offset="0.62" stop-color="#11151f"/>
      <stop offset="1" stop-color="#08090d"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="55%">
      <stop offset="0" stop-color="#ef4760" stop-opacity="0.19"/>
      <stop offset="1" stop-color="#ef4760" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1080" height="1920" fill="url(#bg)"/>
  <rect width="1080" height="1920" fill="url(#glow)"/>

  <text x="92" y="150" fill="#f7f2eb" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="900" letter-spacing="8">RESAKA</text>
  <text x="92" y="205" fill="#9ea3af" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="600">Los datos que no recordabas.</text>
  <text x="92" y="320" fill="#ef4760" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="900" letter-spacing="5">SALIDA REGISTRADA</text>
  <text x="92" y="405" fill="#f7f2eb" font-family="Arial, Helvetica, sans-serif" font-size="70" font-weight="900">Toda noche</text>
  <text x="92" y="480" fill="#f7f2eb" font-family="Arial, Helvetica, sans-serif" font-size="70" font-weight="900">deja rastro.</text>
  <text x="92" y="545" fill="#9ea3af" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700">${escapeXml(formatDate(outing.startedAt))}</text>

  ${options.showRoute ? `
  <rect x="92" y="640" width="896" height="620" rx="48" fill="#141925" stroke="#292f3d" stroke-width="3"/>
  <text x="142" y="720" fill="#8f96a6" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="800" letter-spacing="3">RUTA DE LA NOCHE</text>
  ${route ? `<polyline points="${route}" fill="none" stroke="#ef4760" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>` : `<text x="540" y="955" text-anchor="middle" fill="#737a89" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700">Sin recorrido GPS</text>`}
  ${route ? `<circle cx="${route.split(' ')[0].split(',')[0]}" cy="${route.split(' ')[0].split(',')[1]}" r="16" fill="#5dd39e"/>` : ''}
  ${route ? `<circle cx="${route.split(' ').at(-1)?.split(',')[0]}" cy="${route.split(' ').at(-1)?.split(',')[1]}" r="16" fill="#ef4760" stroke="#f7f2eb" stroke-width="5"/>` : ''}
  ` : `
  <rect x="92" y="640" width="896" height="260" rx="48" fill="#141925" stroke="#292f3d" stroke-width="3"/>
  <text x="540" y="765" text-anchor="middle" fill="#ef4760" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="900">RUTA OCULTA</text>
  <text x="540" y="820" text-anchor="middle" fill="#8f96a6" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="600">Compartido sin ubicación</text>
  `}

  <g transform="translate(92 ${options.showRoute ? 1325 : 965})">
    <rect width="896" height="250" rx="42" fill="#141925" stroke="#292f3d" stroke-width="3"/>
    <g transform="translate(52 54)">
      <text x="0" y="0" fill="#8f96a6" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="800">DURACIÓN</text>
      <text x="0" y="58" fill="#f7f2eb" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="900">${escapeXml(formatDuration(outing.startedAt, outing.endedAt))}</text>
    </g>
    <g transform="translate(328 54)">
      <text x="0" y="0" fill="#8f96a6" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="800">DISTANCIA</text>
      <text x="0" y="58" fill="#f7f2eb" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="900">${escapeXml(formatDistance(outing.distanceMeters))}</text>
    </g>
    <g transform="translate(628 54)">
      <text x="0" y="0" fill="#8f96a6" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="800">GARITOS</text>
      <text x="0" y="58" fill="#f7f2eb" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="900">${options.showVenues ? stops.length : '—'}</text>
    </g>
    <line x1="52" y1="164" x2="844" y2="164" stroke="#292f3d" stroke-width="2"/>
    <text x="52" y="214" fill="#ef4760" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="900">${options.showDrinks ? `${drinks.length} BEBIDAS` : 'CONSUMICIONES OCULTAS'}</text>
  </g>

  ${options.showDrinks ? `
  <g transform="translate(92 ${options.showRoute ? 1610 : 1250})">
    <text x="0" y="0" fill="#8f96a6" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="900" letter-spacing="3">INVENTARIO</text>
    <text x="0" y="64" fill="#f7f2eb" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="800">Cerveza ${beer}   ·   Kalimotxo ${kalimotxo}</text>
    <text x="0" y="112" fill="#f7f2eb" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="800">Chupito ${shot}   ·   Copa ${mixed}</text>
  </g>` : ''}

  ${options.showVenues && venueLine ? `
  <g transform="translate(92 ${options.showRoute ? 1770 : 1450})">
    <text x="0" y="0" fill="#8f96a6" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="900" letter-spacing="3">GARITOS</text>
    <text x="0" y="52" fill="#f7f2eb" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="700">${escapeXml(venueLine)}${extraVenues ? ` · +${extraVenues}` : ''}</text>
  </g>` : ''}

  <text x="988" y="1848" text-anchor="end" fill="#ef4760" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="900">#RESAKA</text>
</svg>`;
}

function svgToPngBlob(svg: string) {
  return new Promise<Blob>((resolve, reject) => {
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(svgUrl);
        reject(new Error('No se pudo preparar la imagen para compartir.'));
        return;
      }

      context.drawImage(image, 0, 0, WIDTH, HEIGHT);
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('No se pudo generar el PNG de la salida.'));
      }, 'image/png', 0.96);
    };

    image.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error('No se pudo renderizar la tarjeta de RESAKA.'));
    };

    image.src = svgUrl;
  });
}

export async function shareOutingCardWeb(completed: CompletedOuting, options: ShareCardOptions): Promise<ShareResult> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('La generación de imagen web no está disponible aquí.');
  }

  const svg = buildOutingShareSvg(completed, options);
  const png = await svgToPngBlob(svg);
  const filename = `resaka-${new Date(completed.outing.startedAt).toISOString().slice(0, 10)}.png`;
  const file = new File([png], filename, { type: 'image/png' });
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
  };

  if (nav.share && nav.canShare?.({ files: [file] })) {
    await nav.share({
      files: [file],
      title: 'Mi salida en RESAKA',
      text: 'Los datos que no recordabas. #RESAKA',
    });
    return 'shared';
  }

  const downloadUrl = URL.createObjectURL(png);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  return 'downloaded';
}

export function buildSharePreviewUri(completed: CompletedOuting, options: ShareCardOptions) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildOutingShareSvg(completed, options))}`;
}
