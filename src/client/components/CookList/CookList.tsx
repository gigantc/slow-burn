import Card from '@/components/Card/Card';
import SyncStatus from '@/components/SyncStatus/SyncStatus';
import { useActiveCook, useCooks } from '@/lib/cookHooks';
import { cookDate, cookDetails } from '@/lib/cookInfo';
import { clockTime, formatDuration } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { cookToCard } from './cookCard';
import styles from './CookList.module.scss';

/** A page of all cooks: the cook in progress pinned first, then the rest newest first. */
const CookList = ({ title }: { title: string }) => {
  const { cooks, meats, ready } = useCooks();
  const meatName = (id: string) => meats.find((meat) => meat.id === id)?.name ?? '';
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
            title={meatName(active.meatId)}
            date={cookDate(active)}
            tags={cookDetails(active)}
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
              {...cookToCard(cook, meatName(cook.meatId))}
            />
          ))}
      </div>
    </section>
  );
};

export default CookList;
