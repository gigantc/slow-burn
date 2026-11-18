import { NavLink } from 'react-router';
import Logo from '@/components/Logo/Logo';
import Icon from '@/components/Icon/Icon';
import Menu from '@/components/Menu/Menu';
import { APP_NAME, NAV_ITEMS } from '@/config';
import styles from './Nav.module.scss';

const Nav = () => {
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
      <Menu />
    </nav>
  );
};

export default Nav;
