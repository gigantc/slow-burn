import { Link } from 'react-router';
import type { CookWithEvents } from 'shared/types';
import Icon from '@/components/Icon/Icon';
import { useMeatName } from '@/lib/cookHooks';
import { cookDetails } from '@/lib/cookInfo';
import { latestEvent } from '@/lib/cookEvents';
import { clockTime, formatDuration } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import styles from './LiveCookCard.module.scss';

const degrees = (value: number | null | undefined) =>
  value === null || value === undefined ? '--' : `${value}°`;

// ISO 8601 duration for <data value>, e.g. PT6H17M.
const isoDuration = (ms: number) => {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  return `PT${Math.floor(minutes / 60)}H${minutes % 60}M`;
};

/** The cook on the pit, as a link to it. Elapsed time, latest pit and meat temps. */
const LiveCookCard = ({ cook }: { cook: CookWithEvents }) => {
  const meat = useMeatName(cook.meatId);
  const now = useNow(60_000);
  const started = cook.startedAt ?? cook.createdAt;
  const elapsed = now - new Date(started).getTime();
  const target = cook.targetInternalTempF;

  return (
    <Link
      className={styles.card}
      to={`/cooks/${cook.id}`}
    >
      <span className={styles.eyebrow}>On the pit</span>
      <h3>{meat}</h3>
      <small className={styles.meta}>
        {[...cookDetails(cook), `since ${clockTime(started)}`].join(' · ')}
      </small>
      <p className={styles.elapsed}>
        <small>Elapsed</small>
        <data value={isoDuration(elapsed)}>{formatDuration(elapsed)}</data>
      </p>
      <p className={styles.pit}>
        <small>Pit</small>
        <data>{degrees(latestEvent(cook.events, 'pit_temp')?.value)}</data>
      </p>
      <p className={styles.meat}>
        <small>{target === null ? 'Meat' : `Meat, target ${target}°`}</small>
        <data>{degrees(latestEvent(cook.events, 'internal_temp')?.value)}</data>
      </p>
      <span className={styles.open}>
        Open cook
        <Icon name="chevron" />
      </span>
    </Link>
  );
};

export default LiveCookCard;
