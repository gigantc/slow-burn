//////////////////////////////////////
// Cook event helpers (data-driven from shared/cookEventTypes)

import { cookEventTypes } from 'shared/cookEventTypes';
import type { CookEventTypeDef, CookEventTypeKey } from 'shared/cookEventTypes';
import type { CookEvent } from 'shared/types';
import type { IconName } from '@/components/Icon/Icon';

type TypedDef = CookEventTypeDef & { key: CookEventTypeKey };

const defs: readonly TypedDef[] = cookEventTypes;

export const eventDef = (key: CookEventTypeKey): TypedDef =>
  defs.find((def) => def.key === key) ?? { key, label: key };

export const eventTypeDefs = defs;

/** Latest event of a type, or of any type when `type` is omitted. */
export const latestEvent = (events: readonly CookEvent[], type?: CookEventTypeKey) =>
  events.reduce<CookEvent | undefined>(
    (best, event) =>
      (!type || event.type === type) && (!best || event.at > best.at) ? event : best,
    undefined,
  );

export const formatValue = (event: CookEvent) =>
  event.value === null ? '' : `${event.value}${eventDef(event.type).value?.unit ?? ''}`;

/** Icon per event type: one place, so a new type in cookEventTypes.ts needs one line here. */
export const eventIcons: Record<CookEventTypeKey, IconName> = {
  on_pit: 'flame',
  pit_temp: 'thermometer',
  internal_temp: 'thermometer',
  spritz: 'drop',
  wrap: 'box',
  unwrap: 'boxOpen',
  add_wood: 'wood',
  off_pit: 'check',
  rest: 'pause',
  note: 'pencil',
};

/** Which series an event belongs to: colors the timeline dot and the temp tiles. */
export const eventKind = (type: CookEventTypeKey): 'start' | 'pit' | 'meat' | 'other' =>
  type === 'on_pit'
    ? 'start'
    : type === 'pit_temp'
      ? 'pit'
      : type === 'internal_temp'
        ? 'meat'
        : 'other';

/** Readings of one temperature event type, oldest first. */
export const readings = (events: readonly CookEvent[], type: 'pit_temp' | 'internal_temp') =>
  events
    .filter((event) => event.type === type && event.value !== null)
    .sort((a, b) => a.at.localeCompare(b.at));

/** A stretch of the cook spent wrapped: `end` is null while it's still wrapped. */
export type WrapSpan = { start: number; end: number | null };

/** Wrap and unwrap events paired into spans, in order. Handles any number of wrap cycles; a wrap
 * while already wrapped, or an unwrap while not, is ignored. */
export const wrapSpans = (events: readonly CookEvent[]): WrapSpan[] => {
  const spans: WrapSpan[] = [];
  const marks = events
    .filter((event) => event.type === 'wrap' || event.type === 'unwrap')
    .sort((a, b) => a.at.localeCompare(b.at));
  for (const event of marks) {
    const at = new Date(event.at).getTime();
    const last = spans[spans.length - 1];
    const open = last?.end === null;
    if (event.type === 'wrap' && !open) spans.push({ start: at, end: null });
    else if (event.type === 'unwrap' && open) last.end = at;
  }
  return spans;
};

/** True while the meat is wrapped: the latest wrap or unwrap event was a wrap. */
export const isWrapped = (events: readonly CookEvent[]) =>
  wrapSpans(events).some((span) => span.end === null);
