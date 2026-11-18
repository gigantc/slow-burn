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
};

export type ApiError = {
  error: { code: string; message: string };
};

export type Me = { authenticated: true };
