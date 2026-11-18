import { NavLink } from 'react-router';
import Logo from '@/components/Logo/Logo';
import Icon from '@/components/Icon/Icon';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import { APP_NAME, NAV_ITEMS } from '@/config';
import { useAuth } from '@/lib/auth';
import styles from './Nav.module.scss';

const Nav = () => {
  const { logout } = useAuth();

  return (
    <nav
      className={styles.nav}
      aria-label="Main"
    >
      <strong>
        <Logo />
        {APP_NAME}
      </strong>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
        >
          <Icon name={item.icon} />
          {item.label}
        </NavLink>
      ))}
      <ThemeToggle />
      <button
        type="button"
        onClick={logout}
      >
        <Icon name="logout" />
        Sign out
      </button>
    </nav>
  );
};

export default Nav;
