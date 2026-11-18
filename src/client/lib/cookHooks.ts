//////////////////////////////////////
// Cook hooks (React access to the store)

import { useSyncExternalStore } from 'react';
import { useMemo } from 'react';
import type { CookWithEvents, Meat } from 'shared/types';
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

/** Meats for pickers: most used first, then alphabetical. */
export const useMeats = (): readonly Meat[] => {
  const { cooks, meats } = useCookState();
  return useMemo(() => {
    const uses = new Map<string, number>();
    for (const cook of cooks) uses.set(cook.meatId, (uses.get(cook.meatId) ?? 0) + 1);
    return [...meats].sort(
      (a, b) => (uses.get(b.id) ?? 0) - (uses.get(a.id) ?? 0) || a.name.localeCompare(b.name),
    );
  }, [cooks, meats]);
};

/** A cook's meat name for titles; empty while the meats list is still loading. */
export const useMeatName = (meatId: string | undefined) => {
  const { meats } = useCookState();
  return meats.find((meat) => meat.id === meatId)?.name ?? '';
};
