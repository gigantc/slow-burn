import Card from '@/components/Card/Card';
import SyncStatus from '@/components/SyncStatus/SyncStatus';
import { useActiveCook, useCooks } from '@/lib/cookHooks';
import { clockTime, formatDuration } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { cookTags, cookToCard } from './cookCard';
import styles from './CookList.module.scss';

/** A page of all cooks: the cook in progress pinned first, then the rest newest first. */
const CookList = ({ title }: { title: string }) => {
  const { cooks, ready } = useCooks();
  const active = useActiveCook();
  const now = useNow(60_000);

  return (
    <section className={styles.list}>
      <h1>{title}</h1>
      <SyncStatus quiet />
      {ready && cooks.length === 0 && (
        <p className={styles.note}>No cooks yet. Tap New cook to log your first one.</p>
      )}
      <div className={styles.grid}>
        {active?.startedAt && (
          <Card
            variant="resume"
            title={active.name}
            tags={cookTags(active)}
            status={`Started ${clockTime(active.startedAt)} · ${formatDuration(now - new Date(active.startedAt).getTime())}`}
            href={`/cooks/${active.id}`}
          />
        )}
        <Card
          variant="add"
          label="New cook"
          href="/cooks/new"
        />
        {cooks
          .filter((cook) => cook !== active)
          .map((cook) => (
            <Card
              key={cook.id}
              {...cookToCard(cook)}
            />
          ))}
      </div>
    </section>
  );
};

export default CookList;
