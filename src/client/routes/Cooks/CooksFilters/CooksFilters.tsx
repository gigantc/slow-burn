import { useState } from 'react';
import Button from '@/components/Button/Button';
import Chip from '@/components/Chip/Chip';
import FacetGroup from '@/components/FacetGroup/FacetGroup';
import Icon from '@/components/Icon/Icon';
import Popover from '@/components/Popover/Popover';
import SearchField from '@/components/SearchField/SearchField';
import Sheet from '@/components/Sheet/Sheet';
import { BP_MD } from '@/config';
import { DEFAULT_VIEW, filterCount, SORTS } from '@/lib/cookFilters';
import type { CookView, Facets, SortKey } from '@/lib/cookFilters';
import { useMediaQuery } from '@/lib/useMediaQuery';
import styles from './CooksFilters.module.scss';

type ListKey = 'meats' | 'ratings' | 'woods' | 'charcoals' | 'years';

type Props = {
  view: CookView;
  facets: Facets;
  /** How many cooks the view matches. */
  count: number;
  onChange: (patch: Partial<CookView>, options?: { replace?: boolean }) => void;
};

const asOptions = (values: readonly string[]) => values.map((value) => ({ value, label: value }));

/**
 * Search, sort and filters for the Cooks list. The facet groups are one component; desktop puts
 * each in a popover under its own button, phone puts them all in one sheet. Which of the two is
 * rendered comes from a media query, so a control is never in the DOM twice.
 */
const CooksFilters = ({ view, facets, count, onChange }: Props) => {
  const phone = useMediaQuery(`(max-width:${BP_MD}px)`);
  const [sheet, setSheet] = useState(false);

  const groups: { key: ListKey; label: string; options: { value: string; label: string }[] }[] = [
    { key: 'meats', label: 'Meat', options: facets.meats },
    { key: 'ratings', label: 'Rating', options: facets.ratings },
    { key: 'woods', label: 'Wood', options: asOptions(facets.woods) },
    { key: 'charcoals', label: 'Charcoal', options: asOptions(facets.charcoals) },
    { key: 'years', label: 'Year', options: asOptions(facets.years) },
  ];
  const shown = groups.filter((group) => group.options.length > 0);

  const toggle = (key: ListKey, value: string) =>
    onChange({
      [key]: view[key].includes(value)
        ? view[key].filter((v) => v !== value)
        : [...view[key], value],
    });
  const clear = () => onChange({ ...DEFAULT_VIEW, sort: view.sort });

  const renderGroup = (group: (typeof groups)[number]) => (
    <FacetGroup
      key={group.key}
      label={group.label}
      options={group.options}
      selected={view[group.key]}
      onToggle={(value) => toggle(group.key, value)}
    />
  );
  const nextToggle = facets.hasNextNotes && (
    <Chip
      selected={view.next}
      onClick={() => onChange({ next: !view.next })}
    >
      Has a Next time note
    </Chip>
  );

  const chips = [
    ...groups.flatMap((group) =>
      view[group.key].map((value) => ({
        id: `${group.key}-${value}`,
        label: group.options.find((o) => o.value === value)?.label ?? value,
        remove: () => toggle(group.key, value),
      })),
    ),
    ...(view.next
      ? [{ id: 'next', label: 'Next time note', remove: () => onChange({ next: false }) }]
      : []),
  ];
  const active = filterCount(view);

  return (
    <div className={styles.filters}>
      <SearchField
        className={styles.search}
        label="Search cooks"
        value={view.q}
        onChange={(q) => onChange({ q }, { replace: true })}
      />
      <label className={styles.sort}>
        <span>Sort</span>
        <select
          value={view.sort}
          onChange={(e) => onChange({ sort: e.target.value as SortKey })}
        >
          {SORTS.map((sort) => (
            <option
              key={sort.key}
              value={sort.key}
            >
              {sort.label}
            </option>
          ))}
        </select>
        <Icon name="chevronDown" />
      </label>
      <div className={styles.controls}>
        {phone ? (
          <>
            <Button
              variant="secondary"
              onClick={() => setSheet(true)}
              aria-haspopup="dialog"
            >
              Filter
              {active > 0 && <span className={styles.badge}>{active}</span>}
            </Button>
            <Sheet
              open={sheet}
              onClose={() => setSheet(false)}
              label="Filter cooks"
            >
              <h2>Filter</h2>
              {shown.map(renderGroup)}
              {nextToggle && <div className={styles.next}>{nextToggle}</div>}
              <Button
                size="lg"
                onClick={() => setSheet(false)}
              >
                Done
              </Button>
              <Button
                size="lg"
                variant="secondary"
                disabled={active === 0}
                onClick={clear}
              >
                Clear all
              </Button>
            </Sheet>
          </>
        ) : (
          <>
            {shown.map((group) => (
              <Popover
                key={group.key}
                label={group.label}
                count={view[group.key].length}
              >
                {renderGroup(group)}
              </Popover>
            ))}
            {nextToggle}
          </>
        )}
      </div>
      {(chips.length > 0 || view.q.trim() !== '') && (
        <div className={styles.active}>
          {chips.map((chip) => (
            <Chip
              key={chip.id}
              aria-label={`Remove ${chip.label}`}
              onClick={chip.remove}
            >
              {chip.label}
              <Icon name="close" />
            </Chip>
          ))}
          <button
            className={styles.clear}
            type="button"
            onClick={clear}
          >
            Clear all
          </button>
        </div>
      )}
      <p
        className={styles.count}
        role="status"
      >
        {count === 1 ? '1 cook' : `${count} cooks`}
      </p>
    </div>
  );
};

export default CooksFilters;
