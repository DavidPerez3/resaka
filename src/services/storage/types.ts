export interface KeyValueStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}

export const storageKeys = {
  activeOuting: 'resaka.active-outing',
  pendingSync: 'resaka.pending-sync',
} as const;
