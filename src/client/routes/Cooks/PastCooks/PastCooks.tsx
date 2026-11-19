import type { CookWithEvents } from 'shared/types';
import Stars from '@/components/Stars/Stars';
import { cookDate, cookDetails } from '@/lib/cookInfo';
import { formatDay, formatDuration } from '@/lib/format';
import styles from './PastCooks.module.scss';

const meta = (cook: CookWithEvents) =>
  [
    cook.weightLbs === null ? null : `${cook.weightLbs} lb`,
    cook.startedAt && cook.endedAt
      ? formatDuration(new Date(cook.endedAt).getTime() - new Date(cook.startedAt).getTime())
      : null,
    ...cookDetails({ weightLbs: null, wood: cook.wood, charcoal: cook.charcoal }),
  ]
    .filter(Boolean)
    .join(' · ');

/** Earlier cooks of the chosen meat, for comparing before you light the fire. */
const PastCooks = ({ meatName, cooks }: { meatName: string; cooks: CookWithEvents[] }) => (
  <section className={styles.past}>
    <h3>{`Past ${meatName.toLowerCase()} cooks`}</h3>
    <ul>
      {cooks.map((cook) => (
        <li key={cook.id}>
          <strong>{formatDay(cookDate(cook))}</strong>
          {cook.rating !== null && <Stars rating={cook.rating} />}
          <small>{meta(cook)}</small>
        </li>
      ))}
    </ul>
  </section>
);

export default PastCooks;
