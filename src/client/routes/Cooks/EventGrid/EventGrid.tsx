import type { CookEventTypeKey } from 'shared/cookEventTypes';
import Icon from '@/components/Icon/Icon';
import PhotoPicker from '@/components/PhotoPicker/PhotoPicker';
import { eventIcons, eventTypeDefs } from '@/lib/cookEvents';
import styles from './EventGrid.module.scss';

// Logged when the cook starts, or ends it: not tap buttons in the grid.
const HIDDEN: readonly CookEventTypeKey[] = ['on_pit', 'off_pit'];

type Props = {
  /** While wrapped the Wrap slot reads Unwrap, and the other way round. */
  wrapped: boolean;
  onTap: (type: CookEventTypeKey) => void;
  /** The terminal action: log "Off the pit" and move on to the wrap-up. */
  onOff: () => void;
  /** Photos picked with the Photo button. It isn't an event: it's a button among them. */
  onPhoto: (files: File[]) => void;
};

/** One button per event type from the shared data, then the accent "Off the pit" action. */
const EventGrid = ({ wrapped, onTap, onOff, onPhoto }: Props) => (
  <div
    className={styles.grid}
    role="group"
    aria-label="Log an event"
  >
    {eventTypeDefs
      .filter((def) => !HIDDEN.includes(def.key) && def.key !== (wrapped ? 'wrap' : 'unwrap'))
      .map((def) => (
        <button
          key={def.key}
          type="button"
          onClick={() => onTap(def.key)}
        >
          <Icon name={eventIcons[def.key]} />
          {def.label}
        </button>
      ))}
    <PhotoPicker
      variant="bare"
      label="Add a photo"
      onPick={onPhoto}
    >
      Photo
    </PhotoPicker>
    <button
      className={styles.off}
      type="button"
      onClick={onOff}
    >
      <Icon name={eventIcons.off_pit} />
      Off the pit
    </button>
  </div>
);

export default EventGrid;
