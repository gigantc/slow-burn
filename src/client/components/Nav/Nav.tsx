import { NavLink } from 'react-router';
import Brand from '@/components/Brand/Brand';
import Button from '@/components/Button/Button';
import Icon from '@/components/Icon/Icon';
import Menu from '@/components/Menu/Menu';
import SyncStatus from '@/components/SyncStatus/SyncStatus';
import { NAV_ITEMS, THEME_LABELS } from '@/config';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import styles from './Nav.module.scss';

// One <nav>, two looks. Desktop: the sidebar on the sky (brand, New cook, links, status, theme,
// sign out). Phone: the tab bar (links plus the Menu tab, which opens the menu sheet).
const Nav = () => {
  const { logout } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <nav
      className={styles.nav}
      aria-label="Main"
    >
      <Brand className={styles.brand} />
      <Button
        className={styles.new}
        to="/cooks/new"
      >
        <Icon name="plus" />
        New cook
      </Button>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          className={styles.item}
          to={item.path}
          end={item.path === '/'}
        >
          <Icon name={item.icon} />
          {item.label}
        </NavLink>
      ))}
      <div className={styles.bottom}>
        <SyncStatus />
        <button
          className={styles.theme}
          type="button"
          onClick={toggle}
        >
          Theme
          <span>{THEME_LABELS[theme]}</span>
        </button>
        <button
          type="button"
          onClick={() => void logout()}
        >
          Sign out
        </button>
      </div>
      <Menu triggerClassName={`${styles.item} ${styles.tab}`} />
    </nav>
  );
};

export default Nav;
