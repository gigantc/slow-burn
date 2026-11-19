import { useCallback, useEffect, useLayoutEffect } from 'react';
import { matchPath, Outlet, useLocation, useNavigationType } from 'react-router';
import Brand from '@/components/Brand/Brand';
import Nav from '@/components/Nav/Nav';
import SyncStatus from '@/components/SyncStatus/SyncStatus';
import UndoToast from '@/components/UndoToast/UndoToast';
import { FORM_ROUTES, SKY_ROUTES } from '@/config';
import { setNotice } from '@/lib/store';
import { useNotice } from '@/lib/storeHooks';
import { startSync, stopSync } from '@/lib/sync';
import { SkyProvider, useSkyState } from '@/lib/sky';
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
  const form = FORM_ROUTES.some((path) => matchPath({ path, end: true }, pathname));
  // Home-style screens: the sky and the phone brand header. Others ask for the sky alone (useSky).
  const brandSky = SKY_ROUTES.some((path) => matchPath({ path, end: true }, pathname));
  const asked = useSkyState();
  const notice = useNotice();
  const closeNotice = useCallback(() => setNotice(null), []);
  const sky = brandSky || asked;

  return (
    <div
      className={[styles.shell, sky && styles.sky, form && styles.form].filter(Boolean).join(' ')}
    >
      <Nav />
      <main>
        {brandSky && (
          <header>
            <Brand />
            <SyncStatus />
          </header>
        )}
        <Outlet />
      </main>
      <UndoToast
        toast={notice}
        onClose={closeNotice}
      />
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
      <SkyProvider>
        <Shell />
      </SkyProvider>
    </UnsavedProvider>
  );
};

export default AppShell;
