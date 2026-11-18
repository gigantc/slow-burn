import { useEffect } from 'react';

/** Keeps the screen on while mounted. Re-acquired when the tab becomes visible again. */
export const useWakeLock = () => {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;

    const acquire = async () => {
      if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
      try {
        lock = await navigator.wakeLock.request('screen');
      } catch {
        // Unsupported or denied (e.g. low battery): the screen just may dim.
      }
    };
    const onVisible = () => void acquire();

    void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      void lock?.release().catch(() => undefined);
    };
  }, []);
};
