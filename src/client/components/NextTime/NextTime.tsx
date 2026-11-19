import type { ReactNode } from 'react';
import Icon from '@/components/Icon/Icon';
import Stars from '@/components/Stars/Stars';
import styles from './NextTime.module.scss';

/** The note from the last cook of this meat. `source` is the small "From your ..." line. */
const NextTime = ({
  source,
  rating,
  children,
}: {
  source: ReactNode;
  /** That cook's rating; shown after the source on phone only. */
  rating?: number;
  children: ReactNode;
}) => (
  <aside className={styles.card}>
    <strong>
      <Icon name="arrow" />
      Next time
    </strong>
    <p>{children}</p>
    <small>
      {source}
      {rating !== undefined && (
        <span>
          {' · '}
          <Stars rating={rating} />
        </span>
      )}
    </small>
  </aside>
);

export default NextTime;
