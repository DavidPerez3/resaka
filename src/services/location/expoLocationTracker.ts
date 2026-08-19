import * as Location from 'expo-location';

import type {
  LocationPoint,
  LocationSubscription,
  LocationTracker,
} from '@/services/location/types';

function toLocationPoint(location: Location.LocationObject): LocationPoint {
  const { coords } = location;

  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy ?? undefined,
    altitude: coords.altitude ?? undefined,
    speed: coords.speed ?? undefined,
    timestamp: location.timestamp,
  };
}

class ExpoLocationTracker implements LocationTracker {
  async requestPermission() {
    const response = await Location.requestForegroundPermissionsAsync();
    return response.granted;
  }

  async getCurrentPosition() {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return toLocationPoint(location);
  }

  async start(onPoint: (point: LocationPoint) => void): Promise<LocationSubscription> {
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 5,
        timeInterval: 5000,
      },
      (location) => onPoint(toLocationPoint(location)),
    );

    return {
      remove: () => subscription.remove(),
    };
  }
}

export const locationTracker: LocationTracker = new ExpoLocationTracker();
