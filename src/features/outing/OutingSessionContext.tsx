import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { BeerSize, DrinkEntry, DrinkType } from '@/domain/drinks';
import type { Outing } from '@/domain/outings';
import { appendRoutePoint, calculateRouteDistance } from '@/domain/route';
import {
  createOutingSessionSnapshot,
  restoreOutingSessionSnapshot,
} from '@/features/outing/persistence';
import type { CompletedOuting } from '@/features/outing/types';
import { locationTracker } from '@/services/location/expoLocationTracker';
import type { LocationPoint } from '@/services/location/types';
import { persistentStorage } from '@/services/storage/asyncStorage';
import { storageKeys } from '@/services/storage/types';

type AddDrinkInput = {
  type: DrinkType;
  beerSize?: BeerSize;
  subtype?: string;
};

export type LocationTrackingStatus = 'idle' | 'requesting' | 'tracking' | 'denied' | 'error';

type OutingSessionContextValue = {
  activeOuting: Outing | null;
  drinks: DrinkEntry[];
  routePoints: LocationPoint[];
  lastFinishedOuting: CompletedOuting | null;
  showCompletionSummary: boolean;
  isHydrated: boolean;
  persistenceError: boolean;
  locationStatus: LocationTrackingStatus;
  locationError: string | null;
  startOuting: () => Outing;
  addDrink: (input: AddDrinkInput) => DrinkEntry | null;
  undoLastDrink: () => DrinkEntry | null;
  finishOuting: () => CompletedOuting | null;
  clearLastFinishedOuting: () => void;
  dismissCompletionSummary: () => void;
  retryLocationTracking: () => void;
};

const OutingSessionContext = createContext<OutingSessionContextValue | null>(null);

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function OutingSessionProvider({ children }: PropsWithChildren) {
  const [activeOuting, setActiveOuting] = useState<Outing | null>(null);
  const [drinks, setDrinks] = useState<DrinkEntry[]>([]);
  const [routePoints, setRoutePoints] = useState<LocationPoint[]>([]);
  const [lastFinishedOuting, setLastFinishedOuting] = useState<CompletedOuting | null>(null);
  const [showCompletionSummary, setShowCompletionSummary] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [persistenceError, setPersistenceError] = useState(false);
  const [locationStatus, setLocationStatus] = useState<LocationTrackingStatus>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationAttempt, setLocationAttempt] = useState(0);

  const ingestRoutePoint = useCallback((point: LocationPoint) => {
    setRoutePoints((current) => appendRoutePoint(current, point));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        const stored = await persistentStorage.get<unknown>(storageKeys.outingSession);
        if (cancelled) return;

        const restored = restoreOutingSessionSnapshot(stored);
        setActiveOuting(restored.activeOuting);
        setDrinks(restored.drinks);
        setRoutePoints(restored.routePoints);
        setLastFinishedOuting(restored.lastFinishedOuting);
      } catch {
        if (!cancelled) setPersistenceError(true);
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const snapshot = createOutingSessionSnapshot({
      activeOuting,
      drinks,
      routePoints,
      lastFinishedOuting,
    });

    void persistentStorage.set(storageKeys.outingSession, snapshot).catch(() => {
      setPersistenceError(true);
    });
  }, [activeOuting, drinks, isHydrated, lastFinishedOuting, routePoints]);

  useEffect(() => {
    if (!activeOuting) return;

    const distanceMeters = calculateRouteDistance(routePoints);
    setActiveOuting((current) => {
      if (!current || Math.abs(current.distanceMeters - distanceMeters) < 0.5) return current;

      return {
        ...current,
        distanceMeters,
        updatedAt: new Date().toISOString(),
      };
    });
  }, [routePoints, activeOuting?.id]);

  useEffect(() => {
    if (!isHydrated || !activeOuting) {
      setLocationStatus('idle');
      setLocationError(null);
      return;
    }

    let cancelled = false;
    let subscription: { remove: () => void | Promise<void> } | null = null;

    const beginTracking = async () => {
      setLocationStatus('requesting');
      setLocationError(null);

      try {
        const granted = await locationTracker.requestPermission();
        if (cancelled) return;

        if (!granted) {
          setLocationStatus('denied');
          return;
        }

        const current = await locationTracker.getCurrentPosition();
        if (cancelled) return;
        if (current) ingestRoutePoint(current);

        subscription = await locationTracker.start(ingestRoutePoint);
        if (cancelled) {
          await subscription.remove();
          return;
        }

        setLocationStatus('tracking');
      } catch (error) {
        if (cancelled) return;
        setLocationStatus('error');
        setLocationError(error instanceof Error ? error.message : 'No se pudo iniciar el GPS.');
      }
    };

    void beginTracking();

    return () => {
      cancelled = true;
      if (subscription) void subscription.remove();
    };
  }, [activeOuting?.id, ingestRoutePoint, isHydrated, locationAttempt]);

  const startOuting = useCallback(() => {
    if (activeOuting) return activeOuting;

    const now = new Date().toISOString();
    const outing: Outing = {
      id: createId('outing'),
      ownerId: 'local-user',
      startedAt: now,
      status: 'ACTIVE',
      distanceMeters: 0,
      visibility: 'PRIVATE',
      drinkVisibility: 'PRIVATE',
      mapVisibility: 'PRIVATE',
      createdAt: now,
      updatedAt: now,
    };

    setShowCompletionSummary(false);
    setActiveOuting(outing);
    setDrinks([]);
    setRoutePoints([]);
    return outing;
  }, [activeOuting]);

  const addDrink = useCallback(
    ({ type, beerSize, subtype }: AddDrinkInput) => {
      if (!activeOuting) return null;
      if (type === 'BEER' && !beerSize) return null;
      if (type !== 'BEER' && beerSize) return null;

      const now = new Date().toISOString();
      const latestPoint = routePoints[routePoints.length - 1];
      const drink: DrinkEntry = {
        id: createId('drink'),
        userId: 'local-user',
        outingId: activeOuting.id,
        type,
        beerSize,
        subtype,
        timestamp: now,
        latitude: latestPoint?.latitude,
        longitude: latestPoint?.longitude,
        createdAt: now,
        updatedAt: now,
      };

      setDrinks((current) => [...current, drink]);
      setActiveOuting((current) =>
        current
          ? {
              ...current,
              updatedAt: now,
            }
          : current,
      );
      return drink;
    },
    [activeOuting, routePoints],
  );

  const undoLastDrink = useCallback(() => {
    if (drinks.length === 0) return null;
    const last = drinks[drinks.length - 1];
    setDrinks((current) => current.slice(0, -1));
    return last;
  }, [drinks]);

  const finishOuting = useCallback(() => {
    if (!activeOuting) return null;

    const now = new Date().toISOString();
    const distanceMeters = calculateRouteDistance(routePoints);
    const finished: Outing = {
      ...activeOuting,
      distanceMeters,
      endedAt: now,
      status: 'FINISHED',
      updatedAt: now,
    };
    const snapshot: CompletedOuting = {
      outing: finished,
      drinks: [...drinks],
      routePoints: [...routePoints],
    };

    setLastFinishedOuting(snapshot);
    setShowCompletionSummary(true);
    setActiveOuting(null);
    setDrinks([]);
    setRoutePoints([]);
    return snapshot;
  }, [activeOuting, drinks, routePoints]);

  const clearLastFinishedOuting = useCallback(() => {
    setShowCompletionSummary(false);
    setLastFinishedOuting(null);
  }, []);
  const dismissCompletionSummary = useCallback(() => setShowCompletionSummary(false), []);
  const retryLocationTracking = useCallback(() => setLocationAttempt((value) => value + 1), []);

  const value = useMemo(
    () => ({
      activeOuting,
      drinks,
      routePoints,
      lastFinishedOuting,
      showCompletionSummary,
      isHydrated,
      persistenceError,
      locationStatus,
      locationError,
      startOuting,
      addDrink,
      undoLastDrink,
      finishOuting,
      clearLastFinishedOuting,
      dismissCompletionSummary,
      retryLocationTracking,
    }),
    [
      activeOuting,
      drinks,
      routePoints,
      lastFinishedOuting,
      showCompletionSummary,
      isHydrated,
      persistenceError,
      locationStatus,
      locationError,
      startOuting,
      addDrink,
      undoLastDrink,
      finishOuting,
      clearLastFinishedOuting,
      dismissCompletionSummary,
      retryLocationTracking,
    ],
  );

  return <OutingSessionContext.Provider value={value}>{children}</OutingSessionContext.Provider>;
}

export function useOutingSession() {
  const context = useContext(OutingSessionContext);
  if (!context) {
    throw new Error('useOutingSession must be used within OutingSessionProvider');
  }
  return context;
}
