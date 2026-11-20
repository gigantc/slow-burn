import { useEffect, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import {
  PHONE_QUERY,
  SHEET_DISMISS_DISTANCE,
  SHEET_DISMISS_VELOCITY,
  SHEET_SETTLE_MS,
} from '@/config';
import styles from './Sheet.module.scss';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Accessible name of the dialog. */
  label: string;
  /** Where focus goes on close; defaults to whatever had it when the sheet opened. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
};

const FOCUSABLE = 'button, input, textarea, select, a[href]';
const NO_DRAG = 'input, textarea, select';
// A drag that starts this close to the top edge (the grab handle) always moves the sheet
const GRAB_ZONE = 56;
// Pixels before a touch counts as a drag
const SLOP = 6;

// Escape and scrim tap close it. On phone a swipe down closes it too. Focus moves in on open (to [data-autofocus] if present),
// is trapped while open, and returns on close.
const Sheet = ({ open, onClose, label, returnFocusRef, children }: Props) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
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

  // Swipe down to close (phone only, where the sheet sits at the bottom). Touch events, not pointer
  // events: a pointer drag is cancelled the moment the browser starts scrolling, and only a
  // touchmove can be told to stop that. The panel follows the finger by transform; the scrim fades.
  useEffect(() => {
    const panel = panelRef.current;
    const scrim = scrimRef.current;
    if (!open || !panel || !scrim) return;

    let start: { y: number; x: number; anchored: boolean } | null = null;
    let dragging = false;
    let offset = 0;
    let last = { y: 0, t: 0 };
    let speed = 0;

    // Anything between the touch and the panel that is scrolled down keeps the drag for itself
    const scrolledWithin = (el: Element | null) => {
      for (; el && el !== panel.parentElement; el = el.parentElement) {
        if (el.scrollTop > 0) return true;
        if (el === panel) break;
      }
      return false;
    };
    const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const show = (y: number) => {
      panel.style.transform = `translateY(${y}px)`;
      scrim.style.opacity = String(Math.max(0, 1 - y / panel.offsetHeight));
    };
    const settle = (y: number, then: () => void) => {
      if (reduced()) {
        then();
        return;
      }
      const ease = `${SHEET_SETTLE_MS}ms ease-out`;
      panel.style.transition = `transform ${ease}`;
      scrim.style.transition = `opacity ${ease}`;
      show(y);
      window.setTimeout(then, SHEET_SETTLE_MS);
    };
    const reset = () => {
      panel.style.transition = '';
      panel.style.transform = '';
      scrim.style.transition = '';
      scrim.style.opacity = '';
    };

    const onStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const target = e.target instanceof Element ? e.target : null;
      start = null;
      if (!touch || e.touches.length > 1 || !window.matchMedia(PHONE_QUERY).matches) return;
      if (target?.closest(NO_DRAG) || scrolledWithin(target)) return;
      start = {
        y: touch.clientY,
        x: touch.clientX,
        anchored: touch.clientY - panel.getBoundingClientRect().top < GRAB_ZONE,
      };
      last = { y: touch.clientY, t: e.timeStamp };
      speed = 0;
      dragging = false;
      offset = 0;
    };

    const onMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!start || !touch) return;
      const dy = touch.clientY - start.y;
      if (!dragging) {
        // Sideways, or upward from the body (a scroll): not ours
        if (Math.abs(touch.clientX - start.x) > Math.abs(dy) || (dy < 0 && !start.anchored)) {
          start = null;
          return;
        }
        if (dy < SLOP) return;
        dragging = true;
        reset();
      }
      if (e.cancelable) e.preventDefault();
      offset = Math.max(0, dy);
      const dt = e.timeStamp - last.t;
      if (dt > 0) speed = (touch.clientY - last.y) / dt;
      last = { y: touch.clientY, t: e.timeStamp };
      show(offset);
    };

    const onEnd = () => {
      if (!start || !dragging) {
        start = null;
        return;
      }
      start = null;
      dragging = false;
      const far = offset > panel.offsetHeight * SHEET_DISMISS_DISTANCE;
      if (far || speed > SHEET_DISMISS_VELOCITY) {
        // Carries on from where the finger left it
        settle(panel.offsetHeight, () => {
          closeRef.current();
          // A caller that keeps the sheet open gets it back
          window.setTimeout(reset, 50);
        });
      } else {
        settle(0, reset);
      }
    };

    panel.addEventListener('touchstart', onStart, { passive: true });
    panel.addEventListener('touchmove', onMove, { passive: false });
    panel.addEventListener('touchend', onEnd);
    panel.addEventListener('touchcancel', onEnd);
    return () => {
      panel.removeEventListener('touchstart', onStart);
      panel.removeEventListener('touchmove', onMove);
      panel.removeEventListener('touchend', onEnd);
      panel.removeEventListener('touchcancel', onEnd);
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        ref={scrimRef}
        className={styles.scrim}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className={styles.panel}
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
