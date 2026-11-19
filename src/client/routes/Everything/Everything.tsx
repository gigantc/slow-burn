import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { tastingCategories } from 'shared/tastingCategories';
import Button from '@/components/Button/Button';
import CategorySwitch from '@/components/CategorySwitch/CategorySwitch';
import EntryList from '@/components/EntryList/EntryList';
import ListFilters from '@/components/ListFilters/ListFilters';
import SyncStatus from '@/components/SyncStatus/SyncStatus';
import type { EntryType } from '@/config';
import {
  applyView,
  DEFAULT_VIEW,
  facetsOf,
  filterCount,
  inCategory,
  parseView,
  sanitizeView,
  SORTS,
  viewToParams,
} from '@/lib/everythingFilters';
import type { EverythingView, SortKey } from '@/lib/everythingFilters';
import { datedEntries } from '@/lib/lately';
import { useStoreState } from '@/lib/storeHooks';
import { toggled } from '@/lib/viewHelpers';
import styles from './Everything.module.scss';

const ALL = 'all';
// Cooks, then every tasting category from the registry
const SWITCH_OPTIONS = [
  { value: ALL, label: 'All' },
  { value: 'cook', label: 'Cooks' },
  ...tastingCategories.map((c) => ({ value: c.key, label: c.label })),
];
const CATEGORY_KEYS = SWITCH_OPTIONS.slice(1).map((option) => option.value);

/** Every cook and tasting in one list (Home's "See all"), with the filters kept in the URL. */
const Everything = () => {
  const { cooks, meats, tastings, ready } = useStoreState();
  const [params, setParams] = useSearchParams();
  const parsed = useMemo(() => parseView(params), [params]);

  const all = useMemo(() => datedEntries(cooks, meats, tastings), [cooks, meats, tastings]);
  const scoped = useMemo(() => inCategory(all, parsed.category), [all, parsed.category]);
  const facets = useMemo(() => facetsOf(scoped), [scoped]);
  const view = useMemo(
    () => (ready ? sanitizeView(parsed, facets) : parsed),
    [parsed, facets, ready],
  );

  const update = (patch: Partial<EverythingView>, options?: { replace?: boolean }) =>
    setParams(viewToParams({ ...view, ...patch }), { replace: options?.replace });
  const clear = () => update({ ...DEFAULT_VIEW, category: view.category, sort: view.sort });

  const entries = useMemo(() => applyView(scoped, view).map((item) => item.entry), [scoped, view]);

  return (
    <div className={styles.everything}>
      <header>
        <h1>Everything</h1>
      </header>
      <SyncStatus quiet />
      <CategorySwitch
        className={styles.switch}
        label="Category"
        options={SWITCH_OPTIONS}
        categories={CATEGORY_KEYS}
        value={view.category ?? ALL}
        onChange={(value) => update({ category: value === ALL ? null : (value as EntryType) })}
      />
      {ready && scoped.length > 0 && (
        <ListFilters
          noun="entries"
          q={view.q}
          onSearch={(q) => update({ q }, { replace: true })}
          sort={view.sort}
          sorts={SORTS}
          onSort={(sort) => update({ sort: sort as SortKey })}
          groups={[
            { key: 'ratings', label: 'Rating', options: facets.ratings, selected: view.ratings },
            {
              key: 'years',
              label: 'Year',
              options: facets.years.map((year) => ({ value: year, label: year })),
              selected: view.years,
            },
          ]}
          onToggle={(key, value) =>
            update({ [key]: toggled(view[key as 'ratings' | 'years'], value) })
          }
          active={filterCount(view)}
          count={entries.length === 1 ? '1 entry' : `${entries.length} entries`}
          onClear={clear}
        />
      )}
      {ready && entries.length > 0 && <EntryList entries={entries} />}
      {ready && scoped.length > 0 && entries.length === 0 && (
        <div className={styles.none}>
          <p>Nothing matches these filters.</p>
          <Button
            variant="secondary"
            onClick={clear}
          >
            Clear all
          </Button>
        </div>
      )}
      {ready && scoped.length === 0 && <p>Nothing logged yet.</p>}
    </div>
  );
};

export default Everything;
