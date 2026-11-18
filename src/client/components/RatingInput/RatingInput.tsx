import type { KeyboardEvent } from 'react';
import { RATING_MAX } from 'shared/constants';
import styles from './RatingInput.module.scss';

type Props = {
  value: number | null;
  onChange: (value: number | null) => void;
};

const STARS = Array.from({ length: RATING_MAX }, (_, i) => i + 1);

// Radio-group semantics: one tab stop, arrows move, tapping the chosen star clears it.
const RatingInput = ({ value, onChange }: Props) => {
  const onKeyDown = (e: KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    onChange(Math.min(RATING_MAX, Math.max(1, (value ?? 0) + step)));
  };

  return (
    <div
      className={styles.stars}
      role="radiogroup"
      aria-label="Rating"
      onKeyDown={onKeyDown}
    >
      {STARS.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
          data-filled={value !== null && n <= value}
          tabIndex={value === n || (value === null && n === 1) ? 0 : -1}
          onClick={() => onChange(value === n ? null : n)}
        >
          {value !== null && n <= value ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
};

export default RatingInput;
