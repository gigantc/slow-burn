import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Button from '@/components/Button/Button';
import Icon from '@/components/Icon/Icon';
import SyncStatus from '@/components/SyncStatus/SyncStatus';
import { THEME_LABELS } from '@/config';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import styles from './Menu.module.scss';

// Rendered as a fragment so the trigger is a direct child of <nav> and takes its tab/sidebar
// styling there; the panel is positioned relative to the nav.
const Menu = () => {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();
  const { theme, toggle } = useTheme();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const buttons = () => [...(panelRef.current?.querySelectorAll('button') ?? [])];
    buttons()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== 'Tab') return;

      // Keep Tab inside the open menu.
      const items = buttons();
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  const signOut = () => {
    setOpen(false);
    void logout();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <Icon name="menu" />
        Menu
      </button>
      {open && (
        <>
          <div
            className={styles.scrim}
            onClick={close}
            aria-hidden="true"
          />
          <div
            ref={panelRef}
            id={panelId}
            className={styles.panel}
            role="dialog"
            aria-label="Menu"
          >
            <button
              type="button"
              role="switch"
              aria-checked={theme === 'dark'}
              aria-label={`${THEME_LABELS.dark} theme`}
              onClick={toggle}
            >
              <span data-active={theme === 'light'}>
                <Icon name="sun" />
                {THEME_LABELS.light}
              </span>
              <span data-active={theme === 'dark'}>
                <Icon name="moon" />
                {THEME_LABELS.dark}
              </span>
            </button>
            <Button
              variant="secondary"
              onClick={signOut}
            >
              <Icon name="logout" />
              Sign out
            </Button>
            <SyncStatus />
          </div>
        </>
      )}
    </>
  );
};

export default Menu;
