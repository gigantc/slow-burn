import type { FormEvent, ReactNode } from 'react';
import styles from './FormPage.module.scss';

type PageProps = {
  title: string;
  onSubmit: (e: FormEvent) => void;
  /** Primary action; sticks to the bottom of the screen on phone. */
  action: ReactNode;
  /** Secondary action, e.g. "Log a past cook". */
  secondary?: ReactNode;
  /** Callouts and summaries: in the sidebar on desktop, above the sections on phone. */
  notes?: ReactNode;
  /** FormSection cards. */
  children: ReactNode;
};

export const FormPage = ({ title, onSubmit, action, secondary, notes, children }: PageProps) => (
  <form
    className={styles.page}
    onSubmit={onSubmit}
  >
    <h1>{title}</h1>
    <div className={styles.main}>{children}</div>
    <aside className={styles.side}>
      <div className={styles.bar}>{action}</div>
      {secondary && <div className={styles.secondary}>{secondary}</div>}
      {notes && <div className={styles.notes}>{notes}</div>}
    </aside>
  </form>
);

type SectionProps = {
  /** Shown as "01", "02", ... in the accent color. */
  number: number;
  title: string;
  highlight?: boolean;
  children: ReactNode;
};

export const FormSection = ({ number, title, highlight = false, children }: SectionProps) => (
  <section className={highlight ? `${styles.card} ${styles.highlight}` : styles.card}>
    <h2>
      <span>{String(number).padStart(2, '0')}</span> {title}
    </h2>
    {children}
  </section>
);
