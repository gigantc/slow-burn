import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import Button from '@/components/Button/Button';
import ConfirmSheet from '@/components/ConfirmSheet/ConfirmSheet';
import SyncStatus from '@/components/SyncStatus/SyncStatus';
import { useUnsavedState } from '@/lib/unsaved';
import { useBack } from '@/lib/useBack';
import styles from './FormPage.module.scss';

type PageProps = {
  title: string;
  onSubmit: (e: FormEvent) => void;
  submitLabel: string;
  submitDisabled?: boolean;
  /** Where Cancel goes when there is no in-app history to go back to. */
  cancelFallback: string;
  /** Context only (callouts, summaries): on the backdrop at the right on desktop, above the sections on phone. */
  notes?: ReactNode;
  /** FormSection cards. */
  children: ReactNode;
};

export const FormPage = ({
  title,
  onSubmit,
  submitLabel,
  submitDisabled = false,
  cancelFallback,
  notes,
  children,
}: PageProps) => {
  const back = useBack();
  const { dirty, setDirty } = useUnsavedState();
  const [confirming, setConfirming] = useState(false);

  const leave = () => {
    setDirty(false);
    setConfirming(false);
    back(cancelFallback);
  };

  return (
    <form
      className={styles.page}
      onSubmit={onSubmit}
    >
      <h1>{title}</h1>
      <div className={styles.main}>{children}</div>
      {notes && <aside className={styles.side}>{notes}</aside>}
      <div className={styles.bar}>
        <SyncStatus />
        <Button
          type="button"
          variant="secondary"
          onClick={() => (dirty ? setConfirming(true) : leave())}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={submitDisabled}
        >
          {submitLabel}
        </Button>
      </div>
      <ConfirmSheet
        open={confirming}
        title="Discard changes?"
        message="Your changes on this screen will be lost."
        confirmLabel="Discard"
        onConfirm={leave}
        onClose={() => setConfirming(false)}
      />
    </form>
  );
};

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
