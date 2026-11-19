import ListFilters from '@/components/ListFilters/ListFilters';
import type { FilterGroup } from '@/components/ListFilters/ListFilters';
import { choiceFields, DEFAULT_VIEW, filterCount, SORTS } from '@/lib/tastingFilters';
import type { Facets, SortKey, TastingView } from '@/lib/tastingFilters';
import { toggled } from '@/lib/viewHelpers';

// Choice groups are keyed `choice:<field key>` so they can't collide with the fixed ones
const CHOICE = 'choice:';

type Props = {
  view: TastingView;
  facets: Facets;
  /** How many tastings the view matches. */
  count: number;
  onChange: (patch: Partial<TastingView>, options?: { replace?: boolean }) => void;
};

/**
 * The Tastings list's filters: the shared ListFilters with a facet per choice field of the chosen
 * category (from the registry), then rating and year.
 */
const TastingsFilters = ({ view, facets, count, onChange }: Props) => {
  const groups: FilterGroup[] = [
    ...choiceFields(view.category).map((field) => {
      const selected = view.choices[field.key] ?? [];
      // Only options some tasting has, plus any picked from an old link, in registry order
      const offered = (field.options ?? []).filter(
        (option) => facets.choices[field.key]?.includes(option) || selected.includes(option),
      );
      return {
        key: `${CHOICE}${field.key}`,
        label: field.label,
        options: offered.map((option) => ({ value: option, label: option })),
        selected,
      };
    }),
    { key: 'ratings', label: 'Rating', options: facets.ratings, selected: view.ratings },
    {
      key: 'years',
      label: 'Year',
      options: facets.years.map((year) => ({ value: year, label: year })),
      selected: view.years,
    },
  ];

  return (
    <ListFilters
      noun="tastings"
      q={view.q}
      onSearch={(q) => onChange({ q }, { replace: true })}
      sort={view.sort}
      sorts={SORTS}
      onSort={(sort) => onChange({ sort: sort as SortKey })}
      groups={groups}
      onToggle={(key, value) =>
        key.startsWith(CHOICE)
          ? onChange({
              choices: {
                ...view.choices,
                [key.slice(CHOICE.length)]: toggled(
                  view.choices[key.slice(CHOICE.length)] ?? [],
                  value,
                ),
              },
            })
          : onChange({ [key]: toggled(view[key as 'ratings' | 'years'], value) })
      }
      active={filterCount(view)}
      count={count === 1 ? '1 tasting' : `${count} tastings`}
      onClear={() => onChange({ ...DEFAULT_VIEW, category: view.category, sort: view.sort })}
    />
  );
};

export default TastingsFilters;
