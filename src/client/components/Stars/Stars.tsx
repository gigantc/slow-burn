import { RATING_MAX } from 'shared/constants';
import styles from './Stars.module.scss';

/** Read-only star rating, e.g. ★★★★☆. Without a rating: five outlined stars, "Not rated". */
const Stars = ({ rating, className }: { rating?: number | null; className?: string }) => {
  const rated = rating !== undefined && rating !== null;
  const classes = [styles.stars, !rated && styles.unrated, className].filter(Boolean).join(' ');

  return (
    <span
      className={classes}
      role="img"
      aria-label={rated ? `${rating} out of ${RATING_MAX} stars` : 'Not rated'}
    >
      {'★'.repeat(rated ? rating : 0)}
      {'☆'.repeat(RATING_MAX - (rated ? rating : 0))}
    </span>
  );
};

export default Stars;
