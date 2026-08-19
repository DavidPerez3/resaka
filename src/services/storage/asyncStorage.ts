import AsyncStorage from '@react-native-async-storage/async-storage';

import type { KeyValueStorage } from '@/services/storage/types';

export const persistentStorage: KeyValueStorage = {
  async get<T>(key: string) {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      await AsyncStorage.removeItem(key);
      return null;
    }
  },

  async set<T>(key: string, value: T) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  async remove(key: string) {
    await AsyncStorage.removeItem(key);
  },
};
