//////////////////////////////////////
// Tasting hooks (React access to the store)

import { useMemo } from 'react';
import type { TastingCategoryKey } from 'shared/tastingCategories';
import type { Tasting } from 'shared/types';
import { useStoreState } from '@/lib/storeHooks';

/** Tastings, newest first, optionally of one category. `ready` is false until IndexedDB is read. */
export const useTastings = (category?: TastingCategoryKey) => {
  const { ready, tastings } = useStoreState();
  const list = useMemo(
    () => (category ? tastings.filter((t) => t.category === category) : tastings),
    [tastings, category],
  );
  return { ready, tastings: list };
};

export const useTasting = (id: string | undefined): Tasting | undefined => {
  const { tastings } = useStoreState();
  return tastings.find((tasting) => tasting.id === id);
};
