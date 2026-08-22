import type { CompletedOuting } from '@/features/outing/types';

export type ShareCardOptions = {
  showRoute: boolean;
  showDrinks: boolean;
  showVenues: boolean;
  backgroundPhotoDataUrl?: string | null;
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

function buildRoutePolyline(completed: CompletedOuting, top: number, height: number) {
  const points = completed.routePoints;
  if (points.length < 2) return '';

  const minLat = Math.min(...points.map((point) => point.latitude));
  const maxLat = Math.max(...points.map((point) => point.latitude));
  const minLon = Math.min(...points.map((point) => point.longitude));
  const maxLon = Math.max(...points.map((point) => point.longitude));
  const latRange = Math.max(maxLat - minLat, 0.000001);
  const lonRange = Math.max(maxLon - minLon, 0.000001);

  const left = 132;
  const boxWidth = 816;
  const padding = 30;

  return points
    .map((point) => {
      const x = left + padding + ((point.longitude - minLon) / lonRange) * (boxWidth - padding * 2);
      const y = top + padding + (1 - (point.latitude - minLat) / latRange) * (height - padding * 2);
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

function buildStatColumns(completed: CompletedOuting, options: ShareCardOptions) {
  const stats = [
    { label: 'DURACIÓN', value: formatDuration(completed.outing.startedAt, completed.outing.endedAt) },
    { label: 'DISTANCIA', value: formatDistance(completed.outing.distanceMeters) },
  ];

  if (options.showVenues) {
    stats.push({ label: 'GARITOS', value: String(completed.stops.length) });
  }

  const columnWidth = 792 / stats.length;
  return stats
    .map((stat, index) => {
      const x = 52 + index * columnWidth;
      return `
      <g transform="translate(${x} 54)">
        <text x="0" y="0" fill="#b8bcc6" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="800">${stat.label}</text>
        <text x="0" y="58" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="900">${escapeXml(stat.value)}</text>
      </g>`;
    })
    .join('');
}

export function buildOutingShareSvg(completed: CompletedOuting, options: ShareCardOptions) {
  const { outing, drinks } = completed;
  const hasPhoto = Boolean(options.backgroundPhotoDataUrl);
  const venues = options.showVenues ? getVenueNames(completed) : [];
  const beer = drinks.filter((drink) => drink.type === 'BEER').length;
  const kalimotxo = drinks.filter((drink) => drink.type === 'KALIMOTXO').length;
  const shot = drinks.filter((drink) => drink.type === 'SHOT').length;
  const mixed = drinks.filter((drink) => drink.type === 'MIXED_DRINK').length;
  const venueLine = venues.slice(0, 3).join(' · ');
  const extraVenues = Math.max(0, venues.length - 3);

  const routeTop = hasPhoto ? 650 : 620;
  const routeHeight = hasPhoto ? 570 : 590;
  const route = options.showRoute ? buildRoutePolyline(completed, routeTop, routeHeight) : '';
  const statsY = options.showRoute ? 1285 : 735;
  const inventoryY = statsY + 300;
  const venuesY = inventoryY + (options.showDrinks ? 175 : 0);

  const photoLayer = hasPhoto
    ? `<image href="${escapeXml(options.backgroundPhotoDataUrl ?? '')}" x="0" y="0" width="1080" height="1920" preserveAspectRatio="xMidYMid slice"/>
       <rect width="1080" height="1920" fill="url(#photoShade)"/>`
    : `<rect width="1080" height="1920" fill="url(#bg)"/>
       <rect width="1080" height="1920" fill="url(#glow)"/>`;

  const routeLayer = options.showRoute
    ? route
      ? `<g>
          ${hasPhoto ? '' : `<rect x="92" y="${routeTop - 30}" width="896" height="${routeHeight + 60}" rx="48" fill="#141925" fill-opacity="0.92" stroke="#292f3d" stroke-width="3"/>`}
          <text x="132" y="${routeTop + 10}" fill="#ffffff" fill-opacity="0.82" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="900" letter-spacing="3">RUTA DE LA NOCHE</text>
          <polyline points="${route}" fill="none" stroke="#ef4760" stroke-width="19" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="${route}" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="29" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="${route}" fill="none" stroke="#ef4760" stroke-width="17" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="${route.split(' ')[0].split(',')[0]}" cy="${route.split(' ')[0].split(',')[1]}" r="16" fill="#5dd39e" stroke="#ffffff" stroke-width="5"/>
          <circle cx="${route.split(' ').at(-1)?.split(',')[0]}" cy="${route.split(' ').at(-1)?.split(',')[1]}" r="16" fill="#ef4760" stroke="#ffffff" stroke-width="5"/>
        </g>`
      : `<text x="540" y="${routeTop + routeHeight / 2}" text-anchor="middle" fill="#ffffff" fill-opacity="0.68" font-family="Arial, Helvetica, sans-serif" font-size="29" font-weight="700">Sin recorrido GPS registrado</text>`
    : '';

  const drinkFooter = options.showDrinks
    ? `<line x1="52" y1="164" x2="844" y2="164" stroke="#ffffff" stroke-opacity="0.15" stroke-width="2"/>
       <text x="52" y="214" fill="#ef4760" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="900">${drinks.length} BEBIDA${drinks.length === 1 ? '' : 'S'}</text>`
    : '';

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
    <linearGradient id="photoShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#05060a" stop-opacity="0.60"/>
      <stop offset="0.34" stop-color="#05060a" stop-opacity="0.20"/>
      <stop offset="0.66" stop-color="#05060a" stop-opacity="0.46"/>
      <stop offset="1" stop-color="#05060a" stop-opacity="0.94"/>
    </linearGradient>
  </defs>

  ${photoLayer}

  <text x="92" y="150" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="900" letter-spacing="8">RESAKA</text>
  <text x="92" y="205" fill="#ffffff" fill-opacity="0.76" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="600">Los datos que no recordabas.</text>
  <text x="92" y="320" fill="#ef4760" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="900" letter-spacing="5">SALIDA REGISTRADA</text>
  <text x="92" y="405" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="70" font-weight="900">Toda noche</text>
  <text x="92" y="480" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="70" font-weight="900">deja rastro.</text>
  <text x="92" y="545" fill="#ffffff" fill-opacity="0.76" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700">${escapeXml(formatDate(outing.startedAt))}</text>

  ${routeLayer}

  <g transform="translate(92 ${statsY})">
    <rect width="896" height="250" rx="42" fill="#080b12" fill-opacity="${hasPhoto ? '0.76' : '0.94'}" stroke="#ffffff" stroke-opacity="0.14" stroke-width="2"/>
    ${buildStatColumns(completed, options)}
    ${drinkFooter}
  </g>

  ${options.showDrinks ? `
  <g transform="translate(92 ${inventoryY})">
    <text x="0" y="0" fill="#ffffff" fill-opacity="0.68" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="900" letter-spacing="3">INVENTARIO</text>
    <text x="0" y="64" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="800">Cerveza ${beer}   ·   Kalimotxo ${kalimotxo}</text>
    <text x="0" y="112" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="800">Chupito ${shot}   ·   Copa ${mixed}</text>
  </g>` : ''}

  ${options.showVenues && venueLine ? `
  <g transform="translate(92 ${venuesY})">
    <text x="0" y="0" fill="#ffffff" fill-opacity="0.68" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="900" letter-spacing="3">GARITOS</text>
    <text x="0" y="52" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="700">${escapeXml(venueLine)}${extraVenues ? ` · +${extraVenues}` : ''}</text>
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

function resizePhotoForShare(dataUrl: string) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const maxWidth = 1600;
      const maxHeight = 2400;
      const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('No se pudo preparar la foto.'));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.88));
    };
    image.onerror = () => reject(new Error('No se pudo leer la foto seleccionada.'));
    image.src = dataUrl;
  });
}

export function pickShareBackgroundPhotoWeb() {
  return new Promise<string | null>((resolve, reject) => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      resolve(null);
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    document.body.appendChild(input);

    let settled = false;
    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(value);
    };

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) {
        finish(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          finish(null);
          return;
        }
        void resizePhotoForShare(reader.result).then(finish).catch(reject);
      };
      reader.onerror = () => reject(new Error('No se pudo leer la foto seleccionada.'));
      reader.readAsDataURL(file);
    });

    const onFocus = () => {
      window.setTimeout(() => {
        if (!input.files?.length) finish(null);
      }, 700);
    };
    window.addEventListener('focus', onFocus, { once: true });
    input.click();
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
