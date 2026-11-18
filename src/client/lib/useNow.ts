import { useEffect, useState } from 'react';

/** Current time in ms, refreshed on an interval, for elapsed-time displays. */
export const useNow = (intervalMs = 30_000) => {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = setInterval(tick, intervalMs);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [intervalMs]);

  return now;
};
