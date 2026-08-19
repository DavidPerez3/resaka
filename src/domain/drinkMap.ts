import type { BeerSize, DrinkEntry, DrinkType } from '@/domain/drinks';
import { distanceBetweenPoints } from '@/domain/route';
import type { LocationPoint } from '@/services/location/types';

const DRINK_CLUSTER_RADIUS_METERS = 25;

export type DrinkMapItem = {
  id: string;
  emoji: string;
  label: string;
  timestamp: string;
  placeLabel: string;
};

export type DrinkMapCluster = {
  id: string;
  latitude: number;
  longitude: number;
  items: DrinkMapItem[];
};

function drinkEmoji(type: DrinkType) {
  if (type === 'BEER') return '🍺';
  if (type === 'KALIMOTXO') return '🍷';
  if (type === 'SHOT') return '🥃';
  return '🍸';
}

function beerLabel(size?: BeerSize) {
  if (size === 'QUINTO') return 'Quinto';
  if (size === 'TERCIO') return 'Tercio';
  if (size === 'LITRONA') return 'Litrona';
  return 'Cerveza';
}

export function drinkDisplayLabel(drink: DrinkEntry) {
  if (drink.type === 'BEER') return beerLabel(drink.beerSize);
  if (drink.type === 'KALIMOTXO') return 'Kalimotxo';
  if (drink.type === 'SHOT') return drink.subtype || 'Chupito';
  return drink.subtype || 'Copa';
}

function toLocationPoint(latitude: number, longitude: number): LocationPoint {
  return { latitude, longitude, timestamp: 0 };
}

function clusterDistance(cluster: DrinkMapCluster, drink: DrinkEntry) {
  return distanceBetweenPoints(
    toLocationPoint(cluster.latitude, cluster.longitude),
    toLocationPoint(drink.latitude as number, drink.longitude as number),
  );
}

export function buildDrinkMapClusters(
  drinks: DrinkEntry[],
  resolvePlaceLabel: (drink: DrinkEntry) => string = () => 'Sin garito',
): DrinkMapCluster[] {
  const locatedDrinks = drinks
    .filter(
      (drink) =>
        typeof drink.latitude === 'number' &&
        Number.isFinite(drink.latitude) &&
        typeof drink.longitude === 'number' &&
        Number.isFinite(drink.longitude),
    )
    .slice()
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const clusters: DrinkMapCluster[] = [];

  for (const drink of locatedDrinks) {
    const existing = clusters.find(
      (cluster) => clusterDistance(cluster, drink) <= DRINK_CLUSTER_RADIUS_METERS,
    );

    const item: DrinkMapItem = {
      id: drink.id,
      emoji: drinkEmoji(drink.type),
      label: drinkDisplayLabel(drink),
      timestamp: drink.timestamp,
      placeLabel: resolvePlaceLabel(drink),
    };

    if (!existing) {
      clusters.push({
        id: `drink-cluster-${drink.id}`,
        latitude: drink.latitude as number,
        longitude: drink.longitude as number,
        items: [item],
      });
      continue;
    }

    const itemCount = existing.items.length;
    existing.latitude =
      (existing.latitude * itemCount + (drink.latitude as number)) / (itemCount + 1);
    existing.longitude =
      (existing.longitude * itemCount + (drink.longitude as number)) / (itemCount + 1);
    existing.items.push(item);
  }

  return clusters;
}

export function buildDrinkClusterTokens(cluster: DrinkMapCluster) {
  const counts = new Map<string, number>();
  for (const item of cluster.items) {
    counts.set(item.emoji, (counts.get(item.emoji) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([emoji, count]) =>
    count > 1 ? `${emoji}${count}` : emoji,
  );
}

export function buildDrinkClusterBadge(cluster: DrinkMapCluster) {
  return buildDrinkClusterTokens(cluster).join(' ');
}

export function formatDrinkMapTime(timestamp: string) {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}
