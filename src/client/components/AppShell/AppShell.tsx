import { Outlet } from 'react-router';
import Nav from '@/components/Nav/Nav';
import styles from './AppShell.module.scss';

const AppShell = () => (
  <div className={styles.shell}>
    <Nav />
    <main>
      <Outlet />
    </main>
  </div>
);

export default AppShell;
