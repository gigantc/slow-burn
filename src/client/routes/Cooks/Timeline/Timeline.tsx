import type { CookEvent } from 'shared/types';
import { eventDef, formatValue } from '@/lib/cookEvents';
import { clockTime, formatDuration } from '@/lib/format';
import styles from './Timeline.module.scss';

type Props = {
  events: readonly CookEvent[];
  startedAt: string | null;
  /** When given, rows are buttons (live edit); otherwise the list is read-only. */
  onSelect?: (event: CookEvent) => void;
};

const Timeline = ({ events, startedAt, onSelect }: Props) => {
  const rows = [...events].sort((a, b) => b.at.localeCompare(a.at));

  const content = (event: CookEvent) => {
    const elapsed = startedAt ? new Date(event.at).getTime() - new Date(startedAt).getTime() : -1;
    return (
      <>
        <time dateTime={event.at}>
          {clockTime(event.at)}
          {elapsed >= 0 && <small>+{formatDuration(elapsed)}</small>}
        </time>
        <span>{eventDef(event.type).label}</span>
        <strong>{formatValue(event)}</strong>
        {event.note && <p>{event.note}</p>}
      </>
    );
  };

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
