export type DrinkType = 'BEER' | 'KALIMOTXO' | 'SHOT' | 'MIXED_DRINK';

export type BeerSize = 'QUINTO' | 'TERCIO' | 'LITRONA';

export interface DrinkEntry {
  id: string;
  userId: string;
  outingId: string;
  venueId?: string;
  type: DrinkType;
  beerSize?: BeerSize;
  subtype?: string;
  notes?: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
}

export function isValidDrinkEntry(entry: DrinkEntry): boolean {
  if (entry.type === 'BEER') {
    return Boolean(entry.beerSize);
  }

  return entry.beerSize === undefined;
}
