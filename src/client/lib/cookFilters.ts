//////////////////////////////////////
// Cook filters, search and sort
// Pure functions over the cached cooks. The Cooks tab keeps a CookView in the URL.

import { RATING_MAX, RATING_MIN } from 'shared/constants';
import type { CookWithEvents, Meat } from 'shared/types';
import { compareCooks, cookDate } from '@/lib/cookInfo';

export type SortKey = 'newest' | 'oldest' | 'rating' | 'longest';

export const SORTS: readonly { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'rating', label: 'Highest rated' },
  { key: 'longest', label: 'Longest cook' },
];

export const UNRATED = 'unrated';

export type CookView = {
  q: string;
  meats: string[];
  /** '1' to '5', or 'unrated' */
  ratings: string[];
  woods: string[];
  charcoals: string[];
  years: string[];
  next: boolean;
  sort: SortKey;
};

export const DEFAULT_VIEW: CookView = {
  q: '',
  meats: [],
  ratings: [],
  woods: [],
  charcoals: [],
  years: [],
  next: false,
  sort: 'newest',
};

const RATING_VALUES = [
  ...Array.from({ length: RATING_MAX - RATING_MIN + 1 }, (_, i) => String(RATING_MAX - i)),
  UNRATED,
];

const isSort = (value: string | null): value is SortKey => SORTS.some((s) => s.key === value);

//////////////////////////////////////
// URL <-> view
// Multi-value filters repeat the key (?meat=a&meat=b) because values such as
// "Cherry, hickory" contain commas. Defaults are left out of the URL.

export const parseView = (params: URLSearchParams): CookView => {
  const sort = params.get('sort');
  return {
    q: params.get('q') ?? '',
    meats: params.getAll('meat'),
    ratings: params.getAll('rating').filter((value) => RATING_VALUES.includes(value)),
    woods: params.getAll('wood'),
    charcoals: params.getAll('charcoal'),
    years: params.getAll('year').filter((value) => /^\d{4}$/.test(value)),
    next: params.get('next') === '1',
    sort: isSort(sort) ? sort : DEFAULT_VIEW.sort,
  };
};

export const viewToParams = (view: CookView): URLSearchParams => {
  const params = new URLSearchParams();
  if (view.q) params.set('q', view.q);
  view.meats.forEach((value) => params.append('meat', value));
  view.ratings.forEach((value) => params.append('rating', value));
  view.woods.forEach((value) => params.append('wood', value));
  view.charcoals.forEach((value) => params.append('charcoal', value));
  view.years.forEach((value) => params.append('year', value));
  if (view.next) params.set('next', '1');
  if (view.sort !== DEFAULT_VIEW.sort) params.set('sort', view.sort);
  return params;
};

/** How many filter values are on (search and sort don't count). */
export const filterCount = (view: CookView) =>
  view.meats.length +
  view.ratings.length +
  view.woods.length +
  view.charcoals.length +
  view.years.length +
  (view.next ? 1 : 0);

export const isFiltered = (view: CookView) => filterCount(view) > 0 || view.q.trim() !== '';

//////////////////////////////////////
// Facets: the options each filter offers, from the cooks that exist

/** "Cherry, hickory" as ["Cherry", "hickory"]: wood and charcoal are free text with several values. */
const splitValues = (value: string | null) =>
  (value ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

/** Distinct split values of a field, most recent cook first, case-insensitive, first casing wins. */
const valuesOf = (cooks: readonly CookWithEvents[], key: 'wood' | 'charcoal') => {
  const seen = new Map<string, string>();
  for (const cook of cooks) {
    for (const part of splitValues(cook[key])) {
      if (!seen.has(part.toLowerCase())) seen.set(part.toLowerCase(), part);
    }
  }
  return [...seen.values()];
};

export type Facets = {
  meats: { value: string; label: string }[];
  ratings: { value: string; label: string }[];
  woods: string[];
  charcoals: string[];
  years: string[];
  hasNextNotes: boolean;
};

export const facetsOf = (cooks: readonly CookWithEvents[], meats: readonly Meat[]): Facets => {
  const used = new Set(cooks.map((cook) => cook.meatId));
  return {
    meats: meats
      .filter((meat) => used.has(meat.id))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((meat) => ({ value: meat.id, label: meat.name })),
    ratings: RATING_VALUES.map((value) => ({
      value,
      label: value === UNRATED ? 'Unrated' : `${value} ★`,
    })),
    woods: valuesOf(cooks, 'wood'),
    charcoals: valuesOf(cooks, 'charcoal'),
    years: [...new Set(cooks.map((cook) => cookDate(cook).slice(0, 4)))].sort().reverse(),
    hasNextNotes: cooks.some((cook) => cook.nextTimeNote?.trim()),
  };
};

/** Drop selections the cooks no longer offer (a stale bookmark), and use the facet's own casing. */
export const sanitizeView = (view: CookView, facets: Facets): CookView => {
  const known = (picked: string[], options: string[]) =>
    picked.flatMap((value) => options.find((o) => o.toLowerCase() === value.toLowerCase()) ?? []);
  return {
    ...view,
    meats: view.meats.filter((id) => facets.meats.some((m) => m.value === id)),
    woods: known(view.woods, facets.woods),
    charcoals: known(view.charcoals, facets.charcoals),
    years: view.years.filter((year) => facets.years.includes(year)),
  };
};

//////////////////////////////////////
// Filter, search, sort

/** Whether any of a field's comma-separated values is in the (lowercased) selection. */
const hasAny = (selected: Set<string>, value: string | null) =>
  splitValues(value).some((part) => selected.has(part.toLowerCase()));

const lower = (list: string[]) => new Set(list.map((value) => value.toLowerCase()));

const duration = (cook: CookWithEvents) =>
  cook.startedAt && cook.endedAt
    ? new Date(cook.endedAt).getTime() - new Date(cook.startedAt).getTime()
    : null;

/** Cooks matching every filter group (any value within a group) and every search word. */
export const filterCooks = (
  cooks: readonly CookWithEvents[],
  meats: readonly Meat[],
  view: CookView,
): CookWithEvents[] => {
  const names = new Map(meats.map((meat) => [meat.id, meat.name]));
  const woods = lower(view.woods);
  const charcoals = lower(view.charcoals);
  const words = view.q.toLowerCase().split(/\s+/).filter(Boolean);

  return cooks.filter((cook) => {
    if (view.meats.length > 0 && !view.meats.includes(cook.meatId)) return false;
    if (view.ratings.length > 0) {
      const own = cook.rating === null ? UNRATED : String(cook.rating);
      if (!view.ratings.includes(own)) return false;
    }
    if (woods.size > 0 && !hasAny(woods, cook.wood)) return false;
    if (charcoals.size > 0 && !hasAny(charcoals, cook.charcoal)) return false;
    if (view.years.length > 0 && !view.years.includes(cookDate(cook).slice(0, 4))) return false;
    if (view.next && !cook.nextTimeNote?.trim()) return false;
    if (words.length > 0) {
      const haystack = [
        names.get(cook.meatId),
        cook.notes,
        cook.prep,
        cook.wood,
        cook.charcoal,
        cook.nextTimeNote,
      ]
        .join(' ')
        .toLowerCase();
      if (!words.every((word) => haystack.includes(word))) return false;
    }
    return true;
  });
};

/** A sorted copy. Ties fall back to newest first. */
export const sortCooks = (cooks: readonly CookWithEvents[], sort: SortKey): CookWithEvents[] => {
  const byRating = (a: CookWithEvents, b: CookWithEvents) => (b.rating ?? 0) - (a.rating ?? 0);
  const byLength = (a: CookWithEvents, b: CookWithEvents) => {
    const [x, y] = [duration(a), duration(b)];
    if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1;
    return y - x;
  };
  const compare: Record<SortKey, (a: CookWithEvents, b: CookWithEvents) => number> = {
    newest: compareCooks,
    oldest: (a, b) => compareCooks(b, a),
    rating: (a, b) => byRating(a, b) || compareCooks(a, b),
    longest: (a, b) => byLength(a, b) || compareCooks(a, b),
  };
  return [...cooks].sort(compare[sort]);
};

export const applyView = (
  cooks: readonly CookWithEvents[],
  meats: readonly Meat[],
  view: CookView,
) => sortCooks(filterCooks(cooks, meats, view), view.sort);
