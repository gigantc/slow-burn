//////////////////////////////////////
// Cook hooks (React access to the store)

import { useSyncExternalStore } from 'react';
import type { CookWithEvents } from 'shared/types';
import { getCookState, getSyncState, subscribe } from '@/lib/cookStore';

const useCookState = () => useSyncExternalStore(subscribe, getCookState);

/** All cooks, newest first. `ready` is false until IndexedDB has been read. */
export const useCooks = () => useCookState();

export const useCook = (id: string | undefined): CookWithEvents | undefined => {
  const { cooks } = useCookState();
  return cooks.find((cook) => cook.id === id);
};

/** Started and not ended; if there are several, the most recently started. */
export const useActiveCook = (): CookWithEvents | undefined => {
  const { cooks } = useCookState();
  return cooks.find((cook) => cook.startedAt && !cook.endedAt);
};

export const useSyncStatus = () => useSyncExternalStore(subscribe, getSyncState);
