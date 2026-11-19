//////////////////////////////////////
// Tasting facts derived from the record: its date, its first spec, its list entry.

import { getTastingCategory } from 'shared/tastingCategories';
import type { TastingFieldDef } from 'shared/tastingCategories';
import type { Tasting } from 'shared/types';
import type { Entry } from '@/components/EntryLink/EntryLink';
import { formatMonthDay, localDate } from '@/lib/format';

type DatedTasting = Pick<Tasting, 'tastedOn' | 'createdAt'>;

/** The local calendar date (YYYY-MM-DD) of a tasting. */
export const tastingDate = (tasting: DatedTasting) =>
  tasting.tastedOn ?? localDate(tasting.createdAt);

/** Newest first: by date, then by when the record was made. */
export const compareTastings = (a: DatedTasting, b: DatedTasting) =>
  tastingDate(b).localeCompare(tastingDate(a)) || b.createdAt.localeCompare(a.createdAt);

/** A field value as shown: "12 yr", "46%", "Speyside". A unit that starts with a letter gets a space. */
export const formatDetail = (field: TastingFieldDef, value: string | number) =>
  field.unit ? `${value}${/^[a-z]/i.test(field.unit) ? ' ' : ''}${field.unit}` : String(value);

/** The first spec field the tasting has a value for, formatted; null if none. */
export const firstSpec = (tasting: Pick<Tasting, 'category' | 'details'>): string | null => {
  for (const field of getTastingCategory(tasting.category).specFields) {
    const value = tasting.details[field.key];
    if (value !== undefined) return formatDetail(field, value);
  }
  return null;
};

/** A tasting as a generic list entry: "Nov 8 · 16 yr · Lagavulin" (date, first spec, maker). */
export const tastingToEntry = (tasting: Tasting): Entry => ({
  id: tasting.id,
  category: tasting.category,
  name: tasting.name,
  meta: [formatMonthDay(tastingDate(tasting)), firstSpec(tasting), tasting.maker]
    .filter(Boolean)
    .join(' · '),
  rating: tasting.rating ?? undefined,
  href: `/tastings/${tasting.id}`,
});
