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
import {
  createOutingSessionSnapshot,
  restoreOutingSessionSnapshot,
} from '@/features/outing/persistence';
import type { CompletedOuting } from '@/features/outing/types';
import { persistentStorage } from '@/services/storage/asyncStorage';
import { storageKeys } from '@/services/storage/types';

type AddDrinkInput = {
  type: DrinkType;
  beerSize?: BeerSize;
  subtype?: string;
};

type OutingSessionContextValue = {
  activeOuting: Outing | null;
  drinks: DrinkEntry[];
  lastFinishedOuting: CompletedOuting | null;
  isHydrated: boolean;
  persistenceError: boolean;
  startOuting: () => Outing;
  addDrink: (input: AddDrinkInput) => DrinkEntry | null;
  undoLastDrink: () => DrinkEntry | null;
  finishOuting: () => CompletedOuting | null;
  clearLastFinishedOuting: () => void;
};

const OutingSessionContext = createContext<OutingSessionContextValue | null>(null);

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function OutingSessionProvider({ children }: PropsWithChildren) {
  const [activeOuting, setActiveOuting] = useState<Outing | null>(null);
  const [drinks, setDrinks] = useState<DrinkEntry[]>([]);
  const [lastFinishedOuting, setLastFinishedOuting] = useState<CompletedOuting | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [persistenceError, setPersistenceError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        const stored = await persistentStorage.get<unknown>(storageKeys.outingSession);
        if (cancelled) return;

        const restored = restoreOutingSessionSnapshot(stored);
        setActiveOuting(restored.activeOuting);
        setDrinks(restored.drinks);
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
      lastFinishedOuting,
    });

    void persistentStorage.set(storageKeys.outingSession, snapshot).catch(() => {
      setPersistenceError(true);
    });
  }, [activeOuting, drinks, isHydrated, lastFinishedOuting]);

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

    setActiveOuting(outing);
    setDrinks([]);
    return outing;
  }, [activeOuting]);

  const addDrink = useCallback(
    ({ type, beerSize, subtype }: AddDrinkInput) => {
      if (!activeOuting) return null;
      if (type === 'BEER' && !beerSize) return null;
      if (type !== 'BEER' && beerSize) return null;

      const now = new Date().toISOString();
      const drink: DrinkEntry = {
        id: createId('drink'),
        userId: 'local-user',
        outingId: activeOuting.id,
        type,
        beerSize,
        subtype,
        timestamp: now,
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
    [activeOuting],
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
    const finished: Outing = {
      ...activeOuting,
      endedAt: now,
      status: 'FINISHED',
      updatedAt: now,
    };
    const snapshot: CompletedOuting = {
      outing: finished,
      drinks: [...drinks],
    };

    setLastFinishedOuting(snapshot);
    setActiveOuting(null);
    setDrinks([]);
    return snapshot;
  }, [activeOuting, drinks]);

  const clearLastFinishedOuting = useCallback(() => setLastFinishedOuting(null), []);

  const value = useMemo(
    () => ({
      activeOuting,
      drinks,
      lastFinishedOuting,
      isHydrated,
      persistenceError,
      startOuting,
      addDrink,
      undoLastDrink,
      finishOuting,
      clearLastFinishedOuting,
    }),
    [
      activeOuting,
      drinks,
      lastFinishedOuting,
      isHydrated,
      persistenceError,
      startOuting,
      addDrink,
      undoLastDrink,
      finishOuting,
      clearLastFinishedOuting,
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
