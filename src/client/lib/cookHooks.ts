//////////////////////////////////////
// Cook hooks (React access to the store)

import { useMemo } from 'react';
import type { CookWithEvents, Meat } from 'shared/types';
import { isLiveCook } from '@/lib/cookInfo';
import { useStoreState } from '@/lib/storeHooks';

/** All cooks, newest first. `ready` is false until IndexedDB has been read. */
export const useCooks = () => useStoreState();

export const useCook = (id: string | undefined): CookWithEvents | undefined => {
  const { cooks } = useStoreState();
  return cooks.find((cook) => cook.id === id);
};

/** On the pit now (see isLiveCook); if there are several, the most recent. */
export const useActiveCook = (): CookWithEvents | undefined => {
  const { cooks } = useStoreState();
  return cooks.find(isLiveCook);
};

/** Meats for pickers: most used first, then alphabetical. */
export const useMeats = (): readonly Meat[] => {
  const { cooks, meats } = useStoreState();
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
  const { meats } = useStoreState();
  return meats.find((meat) => meat.id === meatId)?.name ?? '';
};
