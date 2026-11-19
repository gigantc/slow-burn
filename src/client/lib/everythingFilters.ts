//////////////////////////////////////
// Everything: filters, search and sort over cooks and tastings together
// Pure functions over DatedEntry. The Everything list keeps an EverythingView in the URL. The
// category (?category=cook, whisky...) narrows the list before the other filters, so facets only
// offer what's in it.

import { ENTRY_TYPES } from '@/config';
import type { EntryType } from '@/config';
import { compareDated } from '@/lib/lately';
import type { DatedEntry } from '@/lib/lately';
import {
  byRating,
  COMMON_SORTS,
  matchesRating,
  matchesWords,
  parseRatings,
  parseSort,
  parseYears,
  ratingOptions,
  searchWords,
  yearsOf,
} from '@/lib/viewHelpers';
import type { CommonSortKey } from '@/lib/viewHelpers';

export type SortKey = CommonSortKey;
export const SORTS = COMMON_SORTS;

export type EverythingView = {
  /** null: every kind */
  category: EntryType | null;
  q: string;
  /** '1' to '5', or 'unrated' */
  ratings: string[];
  years: string[];
  sort: SortKey;
};

export const DEFAULT_VIEW: EverythingView = {
  category: null,
  q: '',
  ratings: [],
  years: [],
  sort: 'newest',
};

const CATEGORIES = Object.keys(ENTRY_TYPES) as EntryType[];

//////////////////////////////////////
// URL <-> view

export const parseView = (params: URLSearchParams): EverythingView => ({
  category: CATEGORIES.find((key) => key === params.get('category')) ?? null,
  q: params.get('q') ?? '',
  ratings: parseRatings(params),
  years: parseYears(params),
  sort: parseSort(params.get('sort'), SORTS, DEFAULT_VIEW.sort),
});

export const viewToParams = (view: EverythingView): URLSearchParams => {
  const params = new URLSearchParams();
  if (view.category) params.set('category', view.category);
  if (view.q) params.set('q', view.q);
  view.ratings.forEach((value) => params.append('rating', value));
  view.years.forEach((value) => params.append('year', value));
  if (view.sort !== DEFAULT_VIEW.sort) params.set('sort', view.sort);
  return params;
};

/** How many filter values are on (the category, search and sort don't count). */
export const filterCount = (view: EverythingView) => view.ratings.length + view.years.length;

//////////////////////////////////////
// Scope, facets, filter, sort

/** The entries of one kind, or all of them. */
export const inCategory = (items: readonly DatedEntry[], category: EntryType | null) =>
  category ? items.filter((item) => item.entry.category === category) : [...items];

export type Facets = {
  ratings: { value: string; label: string }[];
  years: string[];
};

export const facetsOf = (items: readonly DatedEntry[]): Facets => ({
  ratings: ratingOptions(),
  years: yearsOf(items.map((item) => item.date)),
});

/** Drop selections the entries no longer offer (a stale bookmark). */
export const sanitizeView = (view: EverythingView, facets: Facets): EverythingView => ({
  ...view,
  years: view.years.filter((year) => facets.years.includes(year)),
});

export const filterItems = (items: readonly DatedEntry[], view: EverythingView) => {
  const words = searchWords(view.q);
  return items.filter(
    (item) =>
      matchesRating(view.ratings, item.entry.rating ?? null) &&
      (view.years.length === 0 || view.years.includes(item.date.slice(0, 4))) &&
      matchesWords(words, item.search),
  );
};

/** A sorted copy. Ties fall back to newest first. */
export const sortItems = (items: readonly DatedEntry[], sort: SortKey) => {
  const rating = (item: DatedEntry) => ({ rating: item.entry.rating ?? null });
  const compare: Record<SortKey, (a: DatedEntry, b: DatedEntry) => number> = {
    newest: compareDated,
    oldest: (a, b) => compareDated(b, a),
    rating: (a, b) => byRating(rating(a), rating(b)) || compareDated(a, b),
  };
  return [...items].sort(compare[sort]);
};

/** Items matching the view's filters and search, sorted (scope them with inCategory first). */
export const applyView = (items: readonly DatedEntry[], view: EverythingView) =>
  sortItems(filterItems(items, view), view.sort);
