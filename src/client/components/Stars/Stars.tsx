import { RATING_MAX } from 'shared/constants';
import styles from './Stars.module.scss';

/** Read-only star rating, e.g. ★★★★☆. */
const Stars = ({ rating, className }: { rating: number; className?: string }) => (
  <span
    className={className ? `${styles.stars} ${className}` : styles.stars}
    role="img"
    aria-label={`${rating} out of ${RATING_MAX} stars`}
  >
    {'★'.repeat(rating)}
    {'☆'.repeat(RATING_MAX - rating)}
  </span>
);

export default Stars;
