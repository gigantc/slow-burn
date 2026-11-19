//////////////////////////////////////
// Tasting filters, search and sort
// Pure functions over the cached tastings. The Tastings tab keeps a TastingView in the URL. The
// category is part of the view (?category=whisky) but the list is narrowed by it in the store
// query (useTastings), so these functions work on one category or all.

import { getTastingCategory, tastingCategoryKeys } from 'shared/tastingCategories';
import type { TastingCategoryKey, TastingFieldDef } from 'shared/tastingCategories';
import type { Tasting } from 'shared/types';
import { compareTastings, tastingDate } from '@/lib/tastingInfo';
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

export type TastingView = {
  /** null: every category */
  category: TastingCategoryKey | null;
  q: string;
  /** '1' to '5', or 'unrated' */
  ratings: string[];
  years: string[];
  /** Selected options of the category's choice fields, by field key (only with a category). */
  choices: Record<string, string[]>;
  sort: SortKey;
};

export const DEFAULT_VIEW: TastingView = {
  category: null,
  q: '',
  ratings: [],
  years: [],
  choices: {},
  sort: 'newest',
};

//////////////////////////////////////
// URL <-> view
// Defaults are left out of the URL. A category's choice fields are filters by field key
// (?category=whisky&type=Scotch&type=Bourbon); they only apply with a category chosen.

/** The choice fields of a category (none for "All"). */
export const choiceFields = (category: TastingCategoryKey | null): TastingFieldDef[] =>
  category ? getTastingCategory(category).specFields.filter((f) => f.kind === 'choice') : [];

export const parseView = (params: URLSearchParams): TastingView => {
  const category = tastingCategoryKeys.find((key) => key === params.get('category')) ?? null;
  const choices = Object.fromEntries(
    choiceFields(category).map((field) => [
      field.key,
      params.getAll(field.key).filter((value) => field.options?.includes(value)),
    ]),
  );
  return {
    category,
    q: params.get('q') ?? '',
    ratings: parseRatings(params),
    years: parseYears(params),
    choices,
    sort: parseSort(params.get('sort'), SORTS, DEFAULT_VIEW.sort),
  };
};

export const viewToParams = (view: TastingView): URLSearchParams => {
  const params = new URLSearchParams();
  if (view.category) params.set('category', view.category);
  if (view.q) params.set('q', view.q);
  view.ratings.forEach((value) => params.append('rating', value));
  view.years.forEach((value) => params.append('year', value));
  choiceFields(view.category).forEach((field) =>
    view.choices[field.key]?.forEach((value) => params.append(field.key, value)),
  );
  if (view.sort !== DEFAULT_VIEW.sort) params.set('sort', view.sort);
  return params;
};

/** How many filter values are on (the category, search and sort don't count). */
export const filterCount = (view: TastingView) =>
  view.ratings.length +
  view.years.length +
  Object.values(view.choices).reduce((sum, list) => sum + list.length, 0);

//////////////////////////////////////
// Facets: the options each filter offers, from the tastings in view

export type Facets = {
  ratings: { value: string; label: string }[];
  years: string[];
  /** Each choice field's options that some tasting has, by field key, in registry order. */
  choices: Record<string, string[]>;
};

export const facetsOf = (
  tastings: readonly Tasting[],
  category: TastingCategoryKey | null,
): Facets => ({
  ratings: ratingOptions(),
  years: yearsOf(tastings.map(tastingDate)),
  choices: Object.fromEntries(
    choiceFields(category).map((field) => [
      field.key,
      (field.options ?? []).filter((option) =>
        tastings.some((tasting) => tasting.details[field.key] === option),
      ),
    ]),
  ),
});

/** Drop selections the tastings no longer offer (a stale bookmark). */
export const sanitizeView = (view: TastingView, facets: Facets): TastingView => ({
  ...view,
  years: view.years.filter((year) => facets.years.includes(year)),
});

//////////////////////////////////////
// Filter, search, sort

/** Tastings matching every filter group (any value within a group) and every search word. */
export const filterTastings = (tastings: readonly Tasting[], view: TastingView): Tasting[] => {
  const words = searchWords(view.q);

  return tastings.filter(
    (tasting) =>
      matchesRating(view.ratings, tasting.rating) &&
      (view.years.length === 0 || view.years.includes(tastingDate(tasting).slice(0, 4))) &&
      Object.entries(view.choices).every(
        ([key, picked]) => picked.length === 0 || picked.includes(String(tasting.details[key])),
      ) &&
      matchesWords(words, [
        tasting.name,
        tasting.maker,
        tasting.notes,
        ...Object.values(tasting.details),
      ]),
  );
};

/** A sorted copy. Ties fall back to newest first. */
export const sortTastings = (tastings: readonly Tasting[], sort: SortKey): Tasting[] => {
  const compare: Record<SortKey, (a: Tasting, b: Tasting) => number> = {
    newest: compareTastings,
    oldest: (a, b) => compareTastings(b, a),
    rating: (a, b) => byRating(a, b) || compareTastings(a, b),
  };
  return [...tastings].sort(compare[sort]);
};

export const applyView = (tastings: readonly Tasting[], view: TastingView) =>
  sortTastings(filterTastings(tastings, view), view.sort);
