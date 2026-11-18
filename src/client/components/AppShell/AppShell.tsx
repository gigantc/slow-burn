import { useEffect } from 'react';
import { Outlet } from 'react-router';
import Nav from '@/components/Nav/Nav';
import { startSync, stopSync } from '@/lib/sync';
import styles from './AppShell.module.scss';

const AppShell = () => {
  // Only mounted when signed in: the local cache and outbox sync while the shell is up.
  useEffect(() => {
    void startSync();
    return stopSync;
  }, []);

  return (
    <div className={styles.shell}>
      <Nav />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
