import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import Button from '@/components/Button/Button';
import EntryList from '@/components/EntryList/EntryList';
import Icon from '@/components/Icon/Icon';
import LiveCookCard from '@/components/LiveCookCard/LiveCookCard';
import SyncStatus from '@/components/SyncStatus/SyncStatus';
import {
  applyView,
  DEFAULT_VIEW,
  facetsOf,
  parseView,
  sanitizeView,
  viewToParams,
} from '@/lib/cookFilters';
import type { CookView } from '@/lib/cookFilters';
import { useActiveCook, useCooks } from '@/lib/cookHooks';
import { cookToEntry } from '@/lib/cookInfo';
import CooksFilters from './CooksFilters/CooksFilters';
import styles from './Cooks.module.scss';

/** Every cook with search, filters and sort kept in the URL; the live cook stays pinned on top. */
const Cooks = () => {
  const { cooks, meats, ready } = useCooks();
  const active = useActiveCook();
  const [params, setParams] = useSearchParams();

  const finished = useMemo(() => cooks.filter((cook) => cook !== active), [cooks, active]);
  const facets = useMemo(() => facetsOf(finished, meats), [finished, meats]);
  const view = useMemo(() => {
    const parsed = parseView(params);
    return ready ? sanitizeView(parsed, facets) : parsed;
  }, [params, facets, ready]);

  const update = (patch: Partial<CookView>, options?: { replace?: boolean }) =>
    setParams(viewToParams({ ...view, ...patch }), { replace: options?.replace });

  const meatName = (id: string) => meats.find((meat) => meat.id === id)?.name ?? '';
  const matches = useMemo(() => applyView(finished, meats, view), [finished, meats, view]);
  const entries = matches.map((cook) => cookToEntry(cook, meatName(cook.meatId)));

  return (
    <div className={styles.cooks}>
      <header>
        <h1>Cooks</h1>
        <Button to="/cooks/new">
          <Icon name="plus" />
          New cook
        </Button>
      </header>
      <SyncStatus quiet />
      {active && <LiveCookCard cook={active} />}
      {ready && finished.length > 0 && (
        <CooksFilters
          view={view}
          facets={facets}
          count={entries.length}
          onChange={update}
        />
      )}
      {ready && entries.length > 0 && (
        <EntryList
          entries={entries}
          hideTag
        />
      )}
      {ready && finished.length > 0 && entries.length === 0 && (
        <div className={styles.none}>
          <p>No cooks match these filters.</p>
          <Button
            variant="secondary"
            onClick={() => update({ ...DEFAULT_VIEW, sort: view.sort })}
          >
            Clear all
          </Button>
        </div>
      )}
      {ready && finished.length === 0 && !active && (
        <p>No cooks yet. Start one and it will show up here.</p>
      )}
    </div>
  );
};

export default Cooks;
