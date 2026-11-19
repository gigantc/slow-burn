//////////////////////////////////////
// Tasting actions
// Local-first, like cook actions: each action updates the cache and outbox immediately and
// returns; the sync engine delivers to the server in the background.

import { cleanDetails } from 'shared/tastingCategories';
import type { Tasting } from 'shared/types';
import { getStoreState, mutate } from '@/lib/store';
import { requestSync } from '@/lib/sync';

export type TastingFields = Omit<Tasting, 'id' | 'createdAt' | 'updatedAt' | 'source'>;
/** `category` is required for a new tasting; `source` is 'import' for one logged after the fact. */
export type TastingInput = Partial<TastingFields> & { id?: string; source?: Tasting['source'] };

const BLANK = {
  name: '',
  maker: null,
  tastedOn: null,
  rating: null,
  notes: null,
  details: {},
} satisfies Partial<TastingFields>;

const findTasting = (id: string) => getStoreState().tastings.find((t) => t.id === id);

const commit = (...args: Parameters<typeof mutate>) => {
  void mutate(...args).then(requestSync);
};

/** Create (no id, or an unknown id) or update (known id) a tasting. Returns it immediately. */
export const saveTasting = (input: TastingInput): Tasting => {
  const now = new Date().toISOString();
  const existing = input.id ? findTasting(input.id) : undefined;
  const { id = crypto.randomUUID(), ...fields } = input;

  const merged = { ...BLANK, source: 'app' as const, createdAt: now, ...existing, ...fields };
  const category = merged.category;
  if (!category) throw new Error('A tasting needs a category.');
  const name = merged.name.trim();
  if (!name) throw new Error('A tasting needs a name.');
  // Same rule as the server: only the category's own fields survive (e.g. after a category switch).
  const details = cleanDetails(category, merged.details);
  if (!details) throw new Error('Invalid tasting details.');

  const tasting: Tasting = { ...merged, category, name, details, id, updatedAt: now };
  const { id: _id, ...body } = tasting;
  commit({ tastingUpserts: [tasting], ops: [{ method: 'PUT', path: `/tastings/${id}`, body }] });
  return tasting;
};

export const deleteTasting = (id: string) => {
  commit({ tastingRemovals: [id], ops: [{ method: 'DELETE', path: `/tastings/${id}` }] });
};
