import type { LocationPoint } from '@/services/location/types';

const EARTH_RADIUS_METERS = 6_371_000;
const MIN_POINT_DISTANCE_METERS = 5;
const MAX_ACCEPTED_ACCURACY_METERS = 150;
const MAX_IMPLIED_SPEED_METERS_PER_SECOND = 80;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceBetweenPoints(a: LocationPoint, b: LocationPoint) {
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const deltaLat = toRadians(b.latitude - a.latitude);
  const deltaLng = toRadians(b.longitude - a.longitude);

  const sinLat = Math.sin(deltaLat / 2);
  const sinLng = Math.sin(deltaLng / 2);
  const haversine =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function isValidLocationPoint(point: LocationPoint) {
  return (
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    Number.isFinite(point.timestamp) &&
    point.latitude >= -90 &&
    point.latitude <= 90 &&
    point.longitude >= -180 &&
    point.longitude <= 180
  );
}

export function shouldAcceptRoutePoint(previous: LocationPoint | undefined, next: LocationPoint) {
  if (!isValidLocationPoint(next)) return false;

  if (
    typeof next.accuracy === 'number' &&
    Number.isFinite(next.accuracy) &&
    next.accuracy > MAX_ACCEPTED_ACCURACY_METERS
  ) {
    return false;
  }

  if (!previous) return true;

  const elapsedSeconds = (next.timestamp - previous.timestamp) / 1000;
  if (elapsedSeconds <= 0) return false;

  const distance = distanceBetweenPoints(previous, next);
  if (distance < MIN_POINT_DISTANCE_METERS) return false;

  const impliedSpeed = distance / elapsedSeconds;
  if (impliedSpeed > MAX_IMPLIED_SPEED_METERS_PER_SECOND) return false;

  return true;
}

export function appendRoutePoint(points: LocationPoint[], next: LocationPoint) {
  const previous = points[points.length - 1];
  if (!shouldAcceptRoutePoint(previous, next)) return points;
  return [...points, next];
}

export function calculateRouteDistance(points: LocationPoint[]) {
  let total = 0;

  for (let index = 1; index < points.length; index += 1) {
    total += distanceBetweenPoints(points[index - 1], points[index]);
  }

  return total;
}

export function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1000) return `${Math.round(distanceMeters)} m`;
  return `${(distanceMeters / 1000).toFixed(distanceMeters >= 10_000 ? 1 : 2)} km`;
}
