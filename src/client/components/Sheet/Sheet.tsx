import { useEffect, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import styles from './Sheet.module.scss';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Accessible name of the dialog. */
  label: string;
  placement?: 'sheet' | 'popover';
  /** Where focus goes on close; defaults to whatever had it when the sheet opened. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
};

const FOCUSABLE = 'button, input, textarea, select, a[href]';

// Escape and scrim tap close it. Focus moves in on open (to [data-autofocus] if present),
// is trapped while open, and returns on close.
const Sheet = ({ open, onClose, label, placement = 'sheet', returnFocusRef, children }: Props) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;

    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const items = () =>
      [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => !el.hasAttribute('disabled'),
      );

    const first = panel.querySelector<HTMLElement>('[data-autofocus]') ?? items()[0];
    first?.focus();
    if (first instanceof HTMLInputElement) first.select();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab') return;

      const list = items();
      const head = list[0];
      const tail = list[list.length - 1];
      if (e.shiftKey && document.activeElement === head) {
        e.preventDefault();
        tail?.focus();
      } else if (!e.shiftKey && document.activeElement === tail) {
        e.preventDefault();
        head?.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      (returnFocusRef?.current ?? previous)?.focus();
    };
  }, [open, returnFocusRef]);

  if (!open) return null;

  const popover = placement === 'popover';

  return (
    <>
      <div
        className={popover ? `${styles.scrim} ${styles.clear}` : styles.scrim}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className={popover ? `${styles.panel} ${styles.popover}` : styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        {children}
      </div>
    </>
  );
};

export default Sheet;
