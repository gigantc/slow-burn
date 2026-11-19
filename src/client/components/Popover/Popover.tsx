import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Icon from '@/components/Icon/Icon';
import styles from './Popover.module.scss';

type Props = {
  label: string;
  /** Shown as a badge on the trigger (e.g. how many filters are on). */
  count?: number;
  children: ReactNode;
};

/** A button that opens a small panel below it. Escape or a click outside closes it. */
const Popover = ({ label, count = 0, children }: Props) => {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div
      ref={root}
      className={styles.popover}
    >
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        data-active={count > 0}
        onClick={() => setOpen((value) => !value)}
      >
        {label}
        {count > 0 && <span>{count}</span>}
        <Icon name="chevronDown" />
      </button>
      {open && (
        <div
          className={styles.panel}
          role="dialog"
          aria-label={label}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default Popover;
