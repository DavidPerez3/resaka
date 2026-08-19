export interface LocationPoint {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  timestamp: number;
}

export type LocationSubscription = {
  remove: () => void | Promise<void>;
};

export interface LocationTracker {
  requestPermission(): Promise<boolean>;
  getCurrentPosition(): Promise<LocationPoint | null>;
  start(onPoint: (point: LocationPoint) => void): Promise<LocationSubscription>;
}
