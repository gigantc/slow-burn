import { RATING_MAX } from 'shared/constants';
import Icon from '@/components/Icon/Icon';
import styles from './RatingInput.module.scss';

type Props = {
  value: number | null;
  onChange: (value: number | null) => void;
  /** Small inline stars with a hidden legend, for a header row. Tap targets stay 44px. */
  compact?: boolean;
  /** Tapping the chosen star clears the rating (default). Off: tapping it does nothing. */
  clearable?: boolean;
};

const STARS = Array.from({ length: RATING_MAX }, (_, i) => i + 1);

// Five toggle buttons: every star up to the rating is pressed.
const RatingInput = ({ value, onChange, compact = false, clearable = true }: Props) => (
  <fieldset className={compact ? `${styles.rating} ${styles.compact}` : styles.rating}>
    <legend>Rating</legend>
    <div>
      {STARS.map((n) => {
        const lit = value !== null && n <= value;
        return (
          <button
            key={n}
            type="button"
            aria-pressed={lit}
            aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
            onClick={() => {
              if (value !== n) onChange(n);
              else if (clearable) onChange(null);
            }}
          >
            <Icon
              name="star"
              filled={lit}
            />
          </button>
        );
      })}
    </div>
  </fieldset>
);

export default RatingInput;
