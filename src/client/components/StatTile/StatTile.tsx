import { Children } from 'react';
import type { ReactNode } from 'react';
import styles from './StatTile.module.scss';

/** A label over a big tabular value (Total time, Final temp). */
const StatTile = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className={styles.tile}>
    <small>{label}</small>
    <data>{value}</data>
  </div>
);

/** A row of StatTiles that shares the width equally; four wrap into two by two. */
export const StatTiles = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div
    className={className ? `${styles.row} ${className}` : styles.row}
    data-count={Children.toArray(children).length}
  >
    {children}
  </div>
);

export default StatTile;
