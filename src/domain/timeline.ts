import type { DrinkEntry } from '@/domain/drinks';
import type { Outing } from '@/domain/outings';
import type { OutingStop, Venue } from '@/domain/venues';

export type TimelineEventType =
  | 'OUTING_START'
  | 'VENUE_ENTER'
  | 'VENUE_EXIT'
  | 'BEER'
  | 'KALIMOTXO'
  | 'SHOT'
  | 'MIXED_DRINK'
  | 'OUTING_END';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: string;
  title: string;
  detail?: string;
  emoji: string;
}

const beerSizeLabel = {
  QUINTO: 'Quinto',
  TERCIO: 'Tercio',
  LITRONA: 'Litrona',
} as const;

function drinkToTimelineEvent(drink: DrinkEntry, venueById: Map<string, Venue>): TimelineEvent {
  const venueName = drink.venueId ? venueById.get(drink.venueId)?.name : undefined;

  if (drink.type === 'BEER') {
    return {
      id: `drink-${drink.id}`,
      type: 'BEER',
      timestamp: drink.timestamp,
      title: drink.beerSize ? beerSizeLabel[drink.beerSize] : 'Cerveza',
      detail: venueName,
      emoji: '🍺',
    };
  }

  const metadata = {
    KALIMOTXO: { type: 'KALIMOTXO', title: 'Kalimotxo', emoji: '🍷' },
    SHOT: { type: 'SHOT', title: 'Chupito', emoji: '🥃' },
    MIXED_DRINK: { type: 'MIXED_DRINK', title: 'Copa', emoji: '🍸' },
  } as const;

  const item = metadata[drink.type];
  return {
    id: `drink-${drink.id}`,
    type: item.type,
    timestamp: drink.timestamp,
    title: item.title,
    detail: [drink.subtype, venueName].filter(Boolean).join(' · ') || undefined,
    emoji: item.emoji,
  };
}

function stopToTimelineEvents(stop: OutingStop, venueById: Map<string, Venue>): TimelineEvent[] {
  const venue = venueById.get(stop.venueId);
  const name = venue?.name ?? 'Garito';
  const events: TimelineEvent[] = [
    {
      id: `stop-enter-${stop.id}`,
      type: 'VENUE_ENTER',
      timestamp: stop.arrivedAt,
      title: `Llegada a ${name}`,
      detail: venue?.address,
      emoji: '📍',
    },
  ];

  if (stop.departedAt) {
    events.push({
      id: `stop-exit-${stop.id}`,
      type: 'VENUE_EXIT',
      timestamp: stop.departedAt,
      title: `Salida de ${name}`,
      emoji: '↗️',
    });
  }

  return events;
}

export function buildOutingTimeline(
  outing: Outing,
  drinks: DrinkEntry[],
  stops: OutingStop[] = [],
  venues: Venue[] = [],
): TimelineEvent[] {
  const venueById = new Map(venues.map((venue) => [venue.id, venue]));
  const events: TimelineEvent[] = [
    {
      id: `outing-start-${outing.id}`,
      type: 'OUTING_START',
      timestamp: outing.startedAt,
      title: 'Empieza la salida',
      emoji: '▶️',
    },
    ...stops.flatMap((stop) => stopToTimelineEvents(stop, venueById)),
    ...drinks.map((drink) => drinkToTimelineEvent(drink, venueById)),
  ];

  if (outing.endedAt) {
    events.push({
      id: `outing-end-${outing.id}`,
      type: 'OUTING_END',
      timestamp: outing.endedAt,
      title: 'Fin de la salida',
      emoji: '🏁',
    });
  }

  return events.sort(
    (left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
  );
}

export function formatTimelineTime(timestamp: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp));
}
