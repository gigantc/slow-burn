import { useRef, useState } from 'react';
import Icon from '@/components/Icon/Icon';
import Sheet from '@/components/Sheet/Sheet';
import SyncStatus from '@/components/SyncStatus/SyncStatus';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import styles from './Menu.module.scss';

// Phone only (the sidebar carries these controls on desktop). Rendered as a fragment so the
// trigger is a direct child of <nav> and takes the tab styling from there.
const Menu = ({ triggerClassName }: { triggerClassName?: string }) => {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();
  const { theme } = useTheme();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const signOut = () => {
    setOpen(false);
    void logout();
  };

  return (
    <>
      <button
        ref={triggerRef}
        className={triggerClassName}
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
        returnFocusRef={triggerRef}
      >
        <span
          className={styles.handle}
          aria-hidden="true"
        />
        <ul className={styles.rows}>
          <li>
            <Icon name={theme === 'dark' ? 'moon' : 'sun'} />
            Theme
            <ThemeToggle />
          </li>
          <li>
            <Icon name="sync" />
            <SyncStatus />
          </li>
          <li>
            <button
              className={styles.signOut}
              type="button"
              onClick={signOut}
            >
              <Icon name="logout" />
              Sign out
            </button>
          </li>
        </ul>
      </Sheet>
    </>
  );
};

export default Menu;
