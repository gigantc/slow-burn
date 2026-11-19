import { RATING_MAX } from 'shared/constants';
import Icon from '@/components/Icon/Icon';
import styles from './RatingInput.module.scss';

type Props = {
  value: number | null;
  onChange: (value: number | null) => void;
};

const STARS = Array.from({ length: RATING_MAX }, (_, i) => i + 1);

// Five toggle buttons: every star up to the rating is pressed. Tapping the chosen star clears it.
const RatingInput = ({ value, onChange }: Props) => (
  <fieldset className={styles.rating}>
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
            onClick={() => onChange(value === n ? null : n)}
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
