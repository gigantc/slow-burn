//////////////////////////////////////
// Cook event helpers (data-driven from shared/cookEventTypes)

import { cookEventTypes } from 'shared/cookEventTypes';
import type { CookEventTypeDef, CookEventTypeKey } from 'shared/cookEventTypes';
import type { CookEvent } from 'shared/types';

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
