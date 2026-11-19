import type { ReactNode } from 'react';
import styles from './StatTile.module.scss';

/** A label over a big tabular value (Total time, Final temp). */
const StatTile = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className={styles.tile}>
    <small>{label}</small>
    <data>{value}</data>
  </div>
);

/** A row of StatTiles that shares the width equally. */
export const StatTiles = ({ children }: { children: ReactNode }) => (
  <div className={styles.row}>{children}</div>
);

export default StatTile;
