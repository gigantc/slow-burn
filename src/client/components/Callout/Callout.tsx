import type { ReactNode } from 'react';
import styles from './Callout.module.scss';

const Callout = ({ title, children }: { title: string; children: ReactNode }) => (
  <aside className={styles.callout}>
    <strong>{title}</strong>
    <p>{children}</p>
  </aside>
);

export default Callout;
