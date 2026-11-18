import { useEffect, useLayoutEffect } from 'react';
import { matchPath, Outlet, useLocation, useNavigationType } from 'react-router';
import Nav from '@/components/Nav/Nav';
import { FOCUS_ROUTES } from '@/config';
import { startSync, stopSync } from '@/lib/sync';
import { UnsavedProvider } from '@/lib/unsaved';
import styles from './AppShell.module.scss';

const Shell = () => {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  // The window is what scrolls. New screens (PUSH/REPLACE) start at the top; back/forward (POP)
  // keeps the browser's own scroll restoration.
  useLayoutEffect(() => {
    if (navigationType !== 'POP') window.scrollTo(0, 0);
  }, [pathname, navigationType]);
  const focusRoute = FOCUS_ROUTES.find(({ path }) => matchPath({ path, end: true }, pathname));

  return (
    <div
      className={[
        styles.shell,
        focusRoute && styles.focus,
        focusRoute?.sidebar && styles.withSidebar,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Nav />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

const AppShell = () => {
  // Only mounted when signed in: the local cache and outbox sync while the shell is up.
  useEffect(() => {
    void startSync();
    return stopSync;
  }, []);

  return (
    <UnsavedProvider>
      <Shell />
    </UnsavedProvider>
  );
};

export default AppShell;
