//////////////////////////////////////
// Shared API types

import type { CookEventTypeKey } from './cookEventTypes.js';
import type { TastingCategoryKey, TastingDetails } from './tastingCategories.js';

export type Meat = {
  id: string;
  name: string;
  nameKey: string;
  createdAt: string;
  updatedAt: string;
};

export type Cook = {
  id: string;
  meatId: string;
  weightLbs: number | null;
  prep: string | null;
  /** Still stored, but no longer asked for. */
  smoker: string | null;
  wood: string | null;
  charcoal: string | null;
  targetPitTempF: number | null;
  targetInternalTempF: number | null;
  /** Local date (YYYY-MM-DD) of a cook logged after the fact; the times may be unknown. */
  cookedOn: string | null;
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

/** Body of PUT /api/meats/:id (the id comes from the path). */
export type MeatUpsert = { name: string; createdAt?: string; updatedAt: string };

export type Tasting = {
  id: string;
  category: TastingCategoryKey;
  name: string;
  maker: string | null;
  /** Local date (YYYY-MM-DD). */
  tastedOn: string | null;
  rating: number | null;
  notes: string | null;
  /** Category spec and note values, keyed by field key (see tastingCategories). */
  details: TastingDetails;
  source: 'app' | 'import';
  createdAt: string;
  updatedAt: string;
};

/** Body of PUT /api/tastings/:id (the id comes from the path). */
export type TastingUpsert = Omit<Tasting, 'id' | 'createdAt'> & { createdAt?: string };

export type PhotoOwnerType = 'cook' | 'tasting';

/** Photo metadata; the image files are at GET /api/photos/:id?size=thumb|display. */
export type Photo = {
  id: string;
  ownerType: PhotoOwnerType;
  ownerId: string;
  /** One photo per owner is featured: the one shown on cards and at the top of the detail. */
  featured: boolean;
  sort: number;
  caption: string | null;
  /** Where the crop of a cropped view stays centered, in percent (0 to 100); null is the center. */
  focusX: number | null;
  focusY: number | null;
  /** Of the display size (1600px long edge at most). */
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
};

/** Body of PATCH /api/photos/:id. Only `featured: true` is accepted; another photo being featured unsets it. */
export type PhotoPatch = {
  caption?: string | null;
  focusX?: number | null;
  focusY?: number | null;
  featured?: true;
  sort?: number;
  updatedAt: string;
};

export type SyncResponse = {
  cooks: CookWithEvents[];
  meats: Meat[];
  tastings: Tasting[];
  photos: Photo[];
};

export type NextTimeNote = {
  cookId: string;
  meatId: string;
  meatName: string;
  /** The cook's `cookedOn` date (YYYY-MM-DD) or, without one, its end timestamp. */
  date: string;
  nextTimeNote: string;
};

export type ApiError = {
  error: { code: string; message: string };
};

export type Me = { authenticated: true };
