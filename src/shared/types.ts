//////////////////////////////////////
// Shared API types

import type { CookEventTypeKey } from './cookEventTypes.js';

export type Cook = {
  id: string;
  name: string;
  protein: string | null;
  cut: string | null;
  weightLbs: number | null;
  prep: string | null;
  smoker: string | null;
  wood: string | null;
  targetPitTempF: number | null;
  startedAt: string | null;
  endedAt: string | null;
  finalInternalTempF: number | null;
  rating: number | null;
  notes: string | null;
  nextTimeNote: string | null;
  source: 'app' | 'import';
  createdAt: string;
  updatedAt: string;
};

export type CookEvent = {
  id: string;
  cookId: string;
  type: CookEventTypeKey;
  at: string;
  value: number | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CookWithEvents = Cook & { events: CookEvent[] };

/** Body of PUT /api/cooks/:id (the id comes from the path). */
export type CookUpsert = Omit<Cook, 'id' | 'createdAt'> & { createdAt?: string };

/** Body of PUT /api/cooks/:id/events/:eventId (ids come from the path). */
export type CookEventUpsert = Omit<CookEvent, 'id' | 'cookId' | 'createdAt'> & {
  createdAt?: string;
};

export type SyncResponse = { cooks: CookWithEvents[] };

export type NextTimeNote = {
  cookId: string;
  name: string;
  endedAt: string;
  nextTimeNote: string;
};

export type ApiError = {
  error: { code: string; message: string };
};

export type Me = { authenticated: true };
