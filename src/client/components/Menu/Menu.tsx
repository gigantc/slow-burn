import { useRef, useState } from 'react';
import Button from '@/components/Button/Button';
import Icon from '@/components/Icon/Icon';
import Sheet from '@/components/Sheet/Sheet';
import SyncStatus from '@/components/SyncStatus/SyncStatus';
import { THEME_LABELS } from '@/config';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import styles from './Menu.module.scss';

// Rendered as a fragment so the trigger is a direct child of <nav> and takes its tab/sidebar
// styling there; the popover is positioned relative to the nav.
const Menu = () => {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();
  const { theme, toggle } = useTheme();
  const triggerRef = useRef<HTMLButtonElement>(null);

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
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="menu" />
        Menu
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        label="Menu"
        placement="popover"
        returnFocusRef={triggerRef}
      >
        <button
          className={styles.switch}
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
          size="large"
          variant="secondary"
          onClick={signOut}
        >
          <Icon name="logout" />
          Sign out
        </Button>
        <SyncStatus />
      </Sheet>
    </>
  );
};

export default Menu;
