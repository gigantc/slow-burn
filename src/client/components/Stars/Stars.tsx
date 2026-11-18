import { RATING_MAX } from 'shared/constants';

/** Read-only star rating, e.g. ★★★★☆. */
const Stars = ({ rating }: { rating: number }) => (
  <span
    role="img"
    aria-label={`${rating} out of ${RATING_MAX} stars`}
  >
    {'★'.repeat(rating)}
    {'☆'.repeat(RATING_MAX - rating)}
  </span>
);

export default Stars;
