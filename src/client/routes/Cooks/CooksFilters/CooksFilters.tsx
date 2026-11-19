import Chip from '@/components/Chip/Chip';
import ListFilters from '@/components/ListFilters/ListFilters';
import type { FilterGroup } from '@/components/ListFilters/ListFilters';
import { DEFAULT_VIEW, filterCount, SORTS } from '@/lib/cookFilters';
import type { CookView, Facets, SortKey } from '@/lib/cookFilters';
import { toggled } from '@/lib/viewHelpers';

type ListKey = 'meats' | 'ratings' | 'woods' | 'charcoals' | 'years';

type Props = {
  view: CookView;
  facets: Facets;
  /** How many cooks the view matches. */
  count: number;
  onChange: (patch: Partial<CookView>, options?: { replace?: boolean }) => void;
};

const asOptions = (values: readonly string[]) => values.map((value) => ({ value, label: value }));

/** The Cooks list's filters: the shared ListFilters with the cook facets and the Next time toggle. */
const CooksFilters = ({ view, facets, count, onChange }: Props) => {
  const groups: (FilterGroup & { key: ListKey })[] = [
    { key: 'meats', label: 'Meat', options: facets.meats, selected: view.meats },
    { key: 'ratings', label: 'Rating', options: facets.ratings, selected: view.ratings },
    { key: 'woods', label: 'Wood', options: asOptions(facets.woods), selected: view.woods },
    {
      key: 'charcoals',
      label: 'Charcoal',
      options: asOptions(facets.charcoals),
      selected: view.charcoals,
    },
    { key: 'years', label: 'Year', options: asOptions(facets.years), selected: view.years },
  ];

  return (
    <ListFilters
      noun="cooks"
      q={view.q}
      onSearch={(q) => onChange({ q }, { replace: true })}
      sort={view.sort}
      sorts={SORTS}
      onSort={(sort) => onChange({ sort: sort as SortKey })}
      groups={groups}
      onToggle={(key, value) => onChange({ [key]: toggled(view[key as ListKey], value) })}
      extra={
        facets.hasNextNotes && (
          <Chip
            selected={view.next}
            onClick={() => onChange({ next: !view.next })}
          >
            Has a Next time note
          </Chip>
        )
      }
      extraChips={
        view.next
          ? [{ id: 'next', label: 'Next time note', remove: () => onChange({ next: false }) }]
          : []
      }
      active={filterCount(view)}
      count={count === 1 ? '1 cook' : `${count} cooks`}
      onClear={() => onChange({ ...DEFAULT_VIEW, sort: view.sort })}
    />
  );
};

export default CooksFilters;
