import { useState } from 'react';
import { useEffect } from 'react';
import { matchPath, Outlet, useLocation } from 'react-router';
import ConfirmSheet from '@/components/ConfirmSheet/ConfirmSheet';
import Icon from '@/components/Icon/Icon';
import Nav from '@/components/Nav/Nav';
import { FOCUS_ROUTES } from '@/config';
import { startSync, stopSync } from '@/lib/sync';
import { useBack } from '@/lib/useBack';
import { UnsavedProvider, useUnsavedState } from '@/lib/unsaved';
import styles from './AppShell.module.scss';

/** Where Close goes when there is no in-app history to go back to. */
const closeFallback = (pathname: string) => {
  const [, id, sub] = pathname.split('/').filter(Boolean);
  if (id === 'new') return '/';
  return sub ? `/cooks/${id}` : '/cooks';
};

const Shell = () => {
  const { pathname } = useLocation();
  const back = useBack();
  const { dirty, setDirty } = useUnsavedState();
  const [confirming, setConfirming] = useState(false);
  const focus = FOCUS_ROUTES.some((path) => matchPath({ path, end: true }, pathname));

  const close = () => {
    setDirty(false);
    setConfirming(false);
    back(closeFallback(pathname));
  };

  return (
    <div className={focus ? `${styles.shell} ${styles.focus}` : styles.shell}>
      <Nav />
      <main>
        {focus && (
          <button
            className={styles.close}
            type="button"
            aria-label="Close"
            onClick={() => (dirty ? setConfirming(true) : close())}
          >
            <Icon name="close" />
          </button>
        )}
        <Outlet />
      </main>
      <ConfirmSheet
        open={confirming}
        title="Discard changes?"
        message="Your changes on this screen will be lost."
        confirmLabel="Discard"
        onConfirm={close}
        onClose={() => setConfirming(false)}
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
      <Shell />
    </UnsavedProvider>
  );
};

export default AppShell;
