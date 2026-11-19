//////////////////////////////////////
// Cook actions
// Local-first: each action updates the cache and outbox immediately and returns; the sync
// engine delivers to the server in the background.

import { meatKey } from 'shared/meats';
import type { Cook, CookEvent, CookWithEvents, Meat, NextTimeNote } from 'shared/types';
import { getCookState, mutate } from '@/lib/cookStore';
import { requestSync } from '@/lib/sync';
import { fetchNextTime } from '@/lib/transport';

export type CookFields = Omit<Cook, 'id' | 'createdAt' | 'updatedAt' | 'source'>;
/** `source` is set when saving: 'import' for a cook logged after the fact, so it is never live. */
export type CookInput = Partial<CookFields> & { id?: string; source?: Cook['source'] };
export type EventInput = Pick<CookEvent, 'type'> &
  Partial<Pick<CookEvent, 'at' | 'value' | 'note'>>;

const BLANK: CookFields = {
  meatId: '',
  weightLbs: null,
  prep: null,
  smoker: null,
  wood: null,
  charcoal: null,
  targetPitTempF: null,
  targetInternalTempF: null,
  cookedOn: null,
  startedAt: null,
  endedAt: null,
  finalInternalTempF: null,
  rating: null,
  notes: null,
  nextTimeNote: null,
};

const findCook = (id: string) => getCookState().cooks.find((cook) => cook.id === id);

const commit = (...args: Parameters<typeof mutate>) => {
  void mutate(...args).then(requestSync);
};

const byTime = (a: CookEvent, b: CookEvent) => a.at.localeCompare(b.at);

//////////////////////////////////////
// Cooks

//////////////////////////////////////
// Meats

/** The meat with this name (matched by normalized key), creating it locally if it's new. */
export const addMeat = (name: string): Meat => {
  const trimmed = name.trim();
  const nameKey = meatKey(trimmed);
  if (!nameKey) throw new Error('A meat needs a name.');

  const existing = getCookState().meats.find((meat) => meat.nameKey === nameKey);
  if (existing) return existing;

  const now = new Date().toISOString();
  const meat: Meat = {
    id: crypto.randomUUID(),
    name: trimmed,
    nameKey,
    createdAt: now,
    updatedAt: now,
  };
  commit({
    meatUpserts: [meat],
    ops: [
      {
        method: 'PUT',
        path: `/meats/${meat.id}`,
        body: { name: meat.name, createdAt: meat.createdAt, updatedAt: meat.updatedAt },
      },
    ],
  });
  return meat;
};

//////////////////////////////////////
// Cooks

/** Create (no id, or an unknown id) or update (known id) a cook. Returns it immediately. */
export const saveCook = (input: CookInput): CookWithEvents => {
  const now = new Date().toISOString();
  const existing = input.id ? findCook(input.id) : undefined;
  const { id = crypto.randomUUID(), ...fields } = input;

  const cook: CookWithEvents = {
    ...BLANK,
    source: 'app',
    createdAt: now,
    events: [],
    ...existing,
    ...fields,
    id,
    updatedAt: now,
  };
  if (!cook.meatId) throw new Error('A cook needs a meat.');

  const { id: _id, events: _events, ...body } = cook;
  commit({ upserts: [cook], ops: [{ method: 'PUT', path: `/cooks/${id}`, body }] });
  return cook;
};

export const deleteCook = (id: string) => {
  commit({ removals: [id], ops: [{ method: 'DELETE', path: `/cooks/${id}` }] });
};

//////////////////////////////////////
// Events

const eventBody = ({ id: _id, cookId: _cookId, ...body }: CookEvent) => body;

const writeEvents = (
  cook: CookWithEvents,
  events: CookEvent[],
  op: Parameters<typeof mutate>[0]['ops'],
) => commit({ upserts: [{ ...cook, events: events.sort(byTime) }], ops: op });

export const addEvent = (cookId: string, input: EventInput): CookEvent => {
  const cook = findCook(cookId);
  if (!cook) throw new Error('Cook not found.');

  const now = new Date().toISOString();
  const event: CookEvent = {
    id: crypto.randomUUID(),
    cookId,
    at: now,
    value: null,
    note: null,
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  writeEvents(
    cook,
    [...cook.events, event],
    [{ method: 'PUT', path: `/cooks/${cookId}/events/${event.id}`, body: eventBody(event) }],
  );
  return event;
};

/** Log "Off the pit" once: a cook that already has one (backed out of Wrap-up) isn't logged again. */
export const markOffPit = (cookId: string) => {
  const cook = findCook(cookId);
  if (cook?.events.some((event) => event.type === 'off_pit')) return;
  addEvent(cookId, { type: 'off_pit' });
};

export const updateEvent = (
  cookId: string,
  eventId: string,
  patch: Partial<Pick<CookEvent, 'type' | 'at' | 'value' | 'note'>>,
) => {
  const cook = findCook(cookId);
  const current = cook?.events.find((event) => event.id === eventId);
  if (!cook || !current) throw new Error('Event not found.');

  const event: CookEvent = { ...current, ...patch, updatedAt: new Date().toISOString() };
  writeEvents(
    cook,
    cook.events.map((e) => (e.id === eventId ? event : e)),
    [{ method: 'PUT', path: `/cooks/${cookId}/events/${eventId}`, body: eventBody(event) }],
  );
};

export const deleteEvent = (cookId: string, eventId: string) => {
  const cook = findCook(cookId);
  if (!cook) return;

  writeEvents(
    cook,
    cook.events.filter((event) => event.id !== eventId),
    [{ method: 'DELETE', path: `/cooks/${cookId}/events/${eventId}` }],
  );
};

//////////////////////////////////////
// Next-time note (online only)

export const fetchNextTimeNote = async (meatId: string): Promise<NextTimeNote | null> => {
  if (!navigator.onLine || !meatId) return null;
  try {
    return await fetchNextTime(meatId);
  } catch {
    return null;
  }
};
