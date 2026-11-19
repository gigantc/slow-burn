//////////////////////////////////////
// List view helpers shared by the Cooks and Tastings lists
// Search, rating and year filters, and sort keys, as pure functions. Each list keeps its own
// view type and URL format (cookFilters.ts, tastingFilters.ts) and builds on these.

import { RATING_MAX, RATING_MIN } from 'shared/constants';

export type SortOption<K extends string> = { key: K; label: string };

/** The sorts every list has; Cooks adds its own. */
export type CommonSortKey = 'newest' | 'oldest' | 'rating';
export const COMMON_SORTS: readonly SortOption<CommonSortKey>[] = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'rating', label: 'Highest rated' },
];

/** The URL value for "no rating", next to '1' to '5'. */
export const UNRATED = 'unrated';

const RATING_VALUES = [
  ...Array.from({ length: RATING_MAX - RATING_MIN + 1 }, (_, i) => String(RATING_MAX - i)),
  UNRATED,
];

/** The Rating facet's options: 5 ★ down to 1 ★, then Unrated. */
export const ratingOptions = () =>
  RATING_VALUES.map((value) => ({
    value,
    label: value === UNRATED ? 'Unrated' : `${value} ★`,
  }));

export const parseRatings = (params: URLSearchParams) =>
  params.getAll('rating').filter((value) => RATING_VALUES.includes(value));

export const parseYears = (params: URLSearchParams) =>
  params.getAll('year').filter((value) => /^\d{4}$/.test(value));

/** The sort in the URL if it's one of `sorts`, else `fallback`. */
export const parseSort = <K extends string>(
  value: string | null,
  sorts: readonly SortOption<K>[],
  fallback: K,
): K => sorts.find((sort) => sort.key === value)?.key ?? fallback;

/** Whether a record's rating is among the selected rating values (none selected: everything). */
export const matchesRating = (selected: readonly string[], rating: number | null) =>
  selected.length === 0 || selected.includes(rating === null ? UNRATED : String(rating));

/** Years (YYYY) of some YYYY-MM-DD dates, newest first. */
export const yearsOf = (dates: readonly string[]) =>
  [...new Set(dates.map((date) => date.slice(0, 4)))].sort().reverse();

/** The lowercase words of a search box. */
export const searchWords = (q: string) => q.toLowerCase().split(/\s+/).filter(Boolean);

/** Whether every search word appears somewhere in the record's searchable text. */
export const matchesWords = (words: readonly string[], parts: readonly unknown[]) => {
  if (words.length === 0) return true;
  const haystack = parts.join(' ').toLowerCase();
  return words.every((word) => haystack.includes(word));
};

/** Descending by rating, unrated last. */
export const byRating = (a: { rating: number | null }, b: { rating: number | null }) =>
  (b.rating ?? 0) - (a.rating ?? 0);

/** `picked` limited to `options` (a stale bookmark loses the rest), in the options' own casing. */
export const knownValues = (picked: readonly string[], options: readonly string[]) =>
  picked.flatMap((value) => options.find((o) => o.toLowerCase() === value.toLowerCase()) ?? []);

/** The list with `value` added, or removed if it was in. */
export const toggled = (list: readonly string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
