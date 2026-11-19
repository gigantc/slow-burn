import type { CookEvent } from 'shared/types';
import { eventDef, eventKind, formatValue } from '@/lib/cookEvents';
import { clockTime } from '@/lib/format';
import styles from './Timeline.module.scss';

type Props = {
  events: readonly CookEvent[];
  /** When given, rows are buttons (live edit); otherwise the list is read-only. */
  onSelect?: (event: CookEvent) => void;
};

/** Events newest first: time, a dot colored by kind, the label and the value. */
const Timeline = ({ events, onSelect }: Props) => {
  const rows = [...events].sort((a, b) => b.at.localeCompare(a.at));

  const content = (event: CookEvent) => (
    <>
      <time dateTime={event.at}>{clockTime(event.at)}</time>
      <i className={styles[eventKind(event.type)]} />
      <span>{eventDef(event.type).label}</span>
      <data>{formatValue(event)}</data>
      {event.note && <p>{event.note}</p>}
    </>
  );

  return (
    <ol className={styles.timeline}>
      {rows.map((event) => (
        <li key={event.id}>
          {onSelect ? (
            <button
              type="button"
              onClick={() => onSelect(event)}
            >
              {content(event)}
            </button>
          ) : (
            <div>{content(event)}</div>
          )}
        </li>
      ))}
    </ol>
  );
};

export default Timeline;
