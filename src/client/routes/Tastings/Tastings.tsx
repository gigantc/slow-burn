import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { getTastingCategory, tastingCategories } from 'shared/tastingCategories';
import type { TastingCategoryKey } from 'shared/tastingCategories';
import Button from '@/components/Button/Button';
import CategorySwitch from '@/components/CategorySwitch/CategorySwitch';
import EntryList from '@/components/EntryList/EntryList';
import Icon from '@/components/Icon/Icon';
import SyncStatus from '@/components/SyncStatus/SyncStatus';
import {
  applyView,
  DEFAULT_VIEW,
  facetsOf,
  parseView,
  sanitizeView,
  viewToParams,
} from '@/lib/tastingFilters';
import type { TastingView } from '@/lib/tastingFilters';
import { useTastings } from '@/lib/tastingHooks';
import { tastingToEntry } from '@/lib/tastingInfo';
import TastingsFilters from './TastingsFilters/TastingsFilters';
import styles from './Tastings.module.scss';

const ALL = 'all';
const SWITCH_OPTIONS = [
  { value: ALL, label: 'All' },
  ...tastingCategories.map((c) => ({ value: c.key, label: c.label })),
];
const CATEGORY_KEYS = tastingCategories.map((c) => c.key);

/** Every tasting, one category or all (?category=), with search, filters and sort in the URL. */
const Tastings = () => {
  const [params, setParams] = useSearchParams();
  const parsed = useMemo(() => parseView(params), [params]);
  const { tastings, ready } = useTastings(parsed.category ?? undefined);

  const facets = useMemo(() => facetsOf(tastings, parsed.category), [tastings, parsed.category]);
  const view = useMemo(
    () => (ready ? sanitizeView(parsed, facets) : parsed),
    [parsed, facets, ready],
  );

  const update = (patch: Partial<TastingView>, options?: { replace?: boolean }) =>
    setParams(viewToParams({ ...view, ...patch }), { replace: options?.replace });

  const matches = useMemo(() => applyView(tastings, view), [tastings, view]);
  const entries = matches.map(tastingToEntry);

  return (
    <div className={styles.tastings}>
      <header>
        <h1>Tastings</h1>
        <Button to={`/tastings/new${view.category ? `?category=${view.category}` : ''}`}>
          <Icon name="plus" />
          New tasting
        </Button>
      </header>
      <SyncStatus quiet />
      <CategorySwitch
        className={styles.switch}
        label="Category"
        options={SWITCH_OPTIONS}
        categories={CATEGORY_KEYS}
        value={view.category ?? ALL}
        onChange={(value) =>
          update({ category: value === ALL ? null : (value as TastingCategoryKey), choices: {} })
        }
      />
      {ready && tastings.length > 0 && (
        <TastingsFilters
          view={view}
          facets={facets}
          count={entries.length}
          onChange={update}
        />
      )}
      {ready && entries.length > 0 && (
        <EntryList
          entries={entries}
          hideTag={view.category !== null}
        />
      )}
      {ready && tastings.length > 0 && entries.length === 0 && (
        <div className={styles.none}>
          <p>No tastings match these filters.</p>
          <Button
            variant="secondary"
            onClick={() => update({ ...DEFAULT_VIEW, category: view.category, sort: view.sort })}
          >
            Clear all
          </Button>
        </div>
      )}
      {ready && tastings.length === 0 && (
        <p>
          {view.category
            ? `No ${getTastingCategory(view.category).singular} tastings yet. Log one and it will show up here.`
            : 'No tastings yet. Log one and it will show up here.'}
        </p>
      )}
    </div>
  );
};

export default Tastings;
