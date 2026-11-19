import { useState } from 'react';
import type { ReactNode } from 'react';
import Button from '@/components/Button/Button';
import Chip from '@/components/Chip/Chip';
import FacetGroup from '@/components/FacetGroup/FacetGroup';
import Icon from '@/components/Icon/Icon';
import Popover from '@/components/Popover/Popover';
import SearchField from '@/components/SearchField/SearchField';
import Sheet from '@/components/Sheet/Sheet';
import { BP_MD } from '@/config';
import { useMediaQuery } from '@/lib/useMediaQuery';
import styles from './ListFilters.module.scss';

export type FilterGroup = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
};

type Props = {
  /** Names the list for screen readers: "Search cooks", "Filter cooks". */
  noun: string;
  q: string;
  onSearch: (q: string) => void;
  sort: string;
  sorts: readonly { key: string; label: string }[];
  onSort: (sort: string) => void;
  /** Facet groups; a group with no options isn't shown. */
  groups: FilterGroup[];
  onToggle: (groupKey: string, value: string) => void;
  /** A toggle that isn't a facet group (shown beside the groups, and at the end of the sheet). */
  extra?: ReactNode;
  /** Removable chips for filters that aren't facet groups. */
  extraChips?: { id: string; label: string; remove: () => void }[];
  /** How many filter values are on, extras included (search and sort don't count). */
  active: number;
  /** "3 cooks" */
  count: string;
  onClear: () => void;
};

/**
 * Search, sort and filters for a list. The facet groups are one component; desktop puts each in
 * a popover under its own button, phone puts them all in one sheet. Which of the two is rendered
 * comes from a media query, so a control is never in the DOM twice.
 */
const ListFilters = ({
  noun,
  q,
  onSearch,
  sort,
  sorts,
  onSort,
  groups,
  onToggle,
  extra,
  extraChips = [],
  active,
  count,
  onClear,
}: Props) => {
  const phone = useMediaQuery(`(max-width:${BP_MD}px)`);
  const [sheet, setSheet] = useState(false);

  const shown = groups.filter((group) => group.options.length > 0);
  const renderGroup = (group: FilterGroup) => (
    <FacetGroup
      key={group.key}
      label={group.label}
      options={group.options}
      selected={group.selected}
      onToggle={(value) => onToggle(group.key, value)}
    />
  );

  const chips = [
    ...groups.flatMap((group) =>
      group.selected.map((value) => ({
        id: `${group.key}-${value}`,
        label: group.options.find((o) => o.value === value)?.label ?? value,
        remove: () => onToggle(group.key, value),
      })),
    ),
    ...extraChips,
  ];

  return (
    <div className={styles.filters}>
      <SearchField
        className={styles.search}
        label={`Search ${noun}`}
        value={q}
        onChange={onSearch}
      />
      <label className={styles.sort}>
        <span>Sort</span>
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value)}
        >
          {sorts.map((option) => (
            <option
              key={option.key}
              value={option.key}
            >
              {option.label}
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
              label={`Filter ${noun}`}
            >
              <h2>Filter</h2>
              {shown.map(renderGroup)}
              {extra && <div className={styles.next}>{extra}</div>}
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
                onClick={onClear}
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
                count={group.selected.length}
              >
                {renderGroup(group)}
              </Popover>
            ))}
            {extra}
          </>
        )}
      </div>
      {(chips.length > 0 || q.trim() !== '') && (
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
            onClick={onClear}
          >
            Clear all
          </button>
        </div>
      )}
      <p
        className={styles.count}
        role="status"
      >
        {count}
      </p>
    </div>
  );
};

export default ListFilters;
