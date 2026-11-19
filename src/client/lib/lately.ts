//////////////////////////////////////
// Cooks and tastings as one dated list (Home's Lately, the Everything list)

import type { CookWithEvents, Meat, Tasting } from 'shared/types';
import type { Entry } from '@/components/EntryLink/EntryLink';
import { cookDate, cookToEntry } from '@/lib/cookInfo';
import { tastingDate, tastingToEntry } from '@/lib/tastingInfo';

/** A list entry with what's needed to order and search it. */
export type DatedEntry = {
  entry: Entry;
  /** Local calendar date, YYYY-MM-DD */
  date: string;
  /** When the record was made or started: breaks ties within a date */
  stamp: string;
  /** Text a search looks in */
  search: unknown[];
};

/** Every cook and tasting as a DatedEntry (unordered). */
export const datedEntries = (
  cooks: readonly CookWithEvents[],
  meats: readonly Meat[],
  tastings: readonly Tasting[],
): DatedEntry[] => {
  const meatName = (id: string) => meats.find((meat) => meat.id === id)?.name ?? '';
  return [
    ...cooks.map((cook) => ({
      entry: cookToEntry(cook, meatName(cook.meatId)),
      date: cookDate(cook),
      stamp: cook.startedAt ?? cook.createdAt,
      search: [
        meatName(cook.meatId),
        cook.notes,
        cook.prep,
        cook.wood,
        cook.charcoal,
        cook.nextTimeNote,
      ],
    })),
    ...tastings.map((tasting) => ({
      entry: tastingToEntry(tasting),
      date: tastingDate(tasting),
      stamp: tasting.createdAt,
      search: [tasting.name, tasting.maker, tasting.notes, ...Object.values(tasting.details)],
    })),
  ];
};

/** Newest first: by date, then by when each was made. */
export const compareDated = (a: DatedEntry, b: DatedEntry) =>
  b.date.localeCompare(a.date) || b.stamp.localeCompare(a.stamp);

/** The `limit` newest entries across cooks and tastings. */
export const latelyEntries = (
  cooks: readonly CookWithEvents[],
  meats: readonly Meat[],
  tastings: readonly Tasting[],
  limit: number,
): Entry[] =>
  datedEntries(cooks, meats, tastings)
    .sort(compareDated)
    .slice(0, limit)
    .map(({ entry }) => entry);
