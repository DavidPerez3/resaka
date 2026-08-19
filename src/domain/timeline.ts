import type { DrinkEntry } from '@/domain/drinks';
import type { Outing } from '@/domain/outings';

export type TimelineEventType =
  | 'OUTING_START'
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

function drinkToTimelineEvent(drink: DrinkEntry): TimelineEvent {
  if (drink.type === 'BEER') {
    return {
      id: `drink-${drink.id}`,
      type: 'BEER',
      timestamp: drink.timestamp,
      title: drink.beerSize ? beerSizeLabel[drink.beerSize] : 'Cerveza',
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
    detail: drink.subtype,
    emoji: item.emoji,
  };
}

export function buildOutingTimeline(outing: Outing, drinks: DrinkEntry[]): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      id: `outing-start-${outing.id}`,
      type: 'OUTING_START',
      timestamp: outing.startedAt,
      title: 'Empieza la salida',
      emoji: '▶️',
    },
    ...drinks.map(drinkToTimelineEvent),
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
