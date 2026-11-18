import type { ReactNode } from 'react';
import styles from './Summary.module.scss';

type Props = {
  title: string;
  rows: [label: string, value: ReactNode][];
  /** Collapse to a single line of values on phone. */
  collapse?: boolean;
};

/** A compact label/value card for sidebars. */
const Summary = ({ title, rows, collapse = false }: Props) => (
  <section className={collapse ? `${styles.summary} ${styles.collapsible}` : styles.summary}>
    <h2>{title}</h2>
    <dl>
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  </section>
);

export default Summary;
