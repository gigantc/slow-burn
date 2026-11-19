import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import Button from '@/components/Button/Button';
import ConfirmSheet from '@/components/ConfirmSheet/ConfirmSheet';
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
  /** Desktop breadcrumb: the parent link, and the current page's name (defaults to `title`). */
  crumb?: { to: string; label: string; current?: string };
  /** Cancel's wording, on the top link and the bar button. */
  cancelLabel?: string;
  /** Show the bar's Cancel button on phone too (the top link is always there). */
  barCancel?: boolean;
  /** Small text at the top right on phone (e.g. the date and time). */
  meta?: string;
  /** A control beside the title on desktop (right-aligned), under it on phone (the category switch). */
  control?: ReactNode;
  /** The first block of the form (on New cook, the meat picker). */
  lead?: ReactNode;
  /** Context (Next time): right column on desktop, right below `lead` on phone. */
  notes?: ReactNode;
  /** More context (past cooks): under `notes` on desktop, after the form on phone. */
  extra?: ReactNode;
  /** The rest of the form. */
  children: ReactNode;
};

/**
 * Shared layout for form screens. Phone: Cancel link and meta on top, then the title, `lead`,
 * `notes`, the rest, `extra`, and a sticky action bar. Desktop: breadcrumb and title, the form on
 * the left with inline right-aligned actions, `notes` and `extra` stacked on the right.
 */
export const FormPage = ({
  title,
  onSubmit,
  submitLabel,
  submitDisabled = false,
  cancelFallback,
  crumb = { to: '/cooks', label: 'Cooks' },
  cancelLabel = 'Cancel',
  barCancel = true,
  meta,
  control,
  lead,
  notes,
  extra,
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
  const cancel = () => (dirty ? setConfirming(true) : leave());

  return (
    <form
      className={styles.page}
      onSubmit={onSubmit}
    >
      <header>
        <button
          className={styles.cancel}
          type="button"
          onClick={cancel}
        >
          {cancelLabel}
        </button>
        {meta && <small>{meta}</small>}
        <Breadcrumb
          to={crumb.to}
          label={crumb.label}
          current={crumb.current ?? title}
        />
      </header>
      <h1>{title}</h1>
      {control && <div className={styles.control}>{control}</div>}
      {lead && <div className={styles.lead}>{lead}</div>}
      {(notes || extra) && (
        <div className={styles.side}>
          {notes && <div className={styles.notes}>{notes}</div>}
          {extra && <div className={styles.extra}>{extra}</div>}
        </div>
      )}
      <div className={styles.fields}>{children}</div>
      <div className={barCancel ? styles.bar : `${styles.bar} ${styles.solo}`}>
        <Button
          className={styles.back}
          type="button"
          variant="secondary"
          size="lg"
          onClick={cancel}
        >
          {cancelLabel}
        </Button>
        <Button
          type="submit"
          size="lg"
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

/** Grid for Field cards inside the form: two across on phone, as many as fit on desktop. */
export const FieldGrid = ({
  wide = false,
  threeUp = false,
  children,
}: {
  /** For wide controls (date and time): one per row on phone. */
  wide?: boolean;
  /** Exactly three short fields: three across, phone included. */
  threeUp?: boolean;
  children: ReactNode;
}) => (
  <div
    className={[styles.grid, wide && styles.wide, threeUp && styles.threeUp]
      .filter(Boolean)
      .join(' ')}
  >
    {children}
  </div>
);
