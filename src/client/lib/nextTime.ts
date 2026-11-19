//////////////////////////////////////
// Next-time note lookup
// Matches on meatId. Local cache first (works offline); the API is only a fallback for notes
// that are not cached yet.

import { useEffect, useMemo, useState } from 'react';
import type { CookWithEvents, Meat, NextTimeNote } from 'shared/types';
import { fetchNextTimeNote } from '@/lib/cookActions';
import { useCooks } from '@/lib/cookHooks';
import { cookDate, isLiveCook } from '@/lib/cookInfo';

/** Finished cooks of this meat, newest first (the store keeps cooks in that order). */
export const findPastCooks = (
  cooks: readonly CookWithEvents[],
  meatId: string,
  excludeId?: string,
): CookWithEvents[] =>
  cooks.filter((cook) => cook.id !== excludeId && cook.meatId === meatId && !isLiveCook(cook));

export const findNextTimeNote = (
  cooks: readonly CookWithEvents[],
  meats: readonly Meat[],
  meatId: string,
  excludeId?: string,
): NextTimeNote | null => {
  const meat = meats.find((m) => m.id === meatId);
  // The store is newest first, so the first cook with a note is the latest.
  for (const cook of cooks) {
    const note = cook.nextTimeNote?.trim();
    if (!meat || cook.id === excludeId || isLiveCook(cook) || !note || cook.meatId !== meatId)
      continue;
    return {
      cookId: cook.id,
      meatId,
      meatName: meat.name,
      date: cookDate(cook),
      nextTimeNote: note,
    };
  }
  return null;
};

export const useNextTimeNote = (meatId: string, excludeId?: string): NextTimeNote | null => {
  const { cooks, meats } = useCooks();
  const local = useMemo(
    () => findNextTimeNote(cooks, meats, meatId, excludeId),
    [cooks, meats, meatId, excludeId],
  );
  const [remote, setRemote] = useState<{ meatId: string; note: NextTimeNote | null } | null>(null);

  useEffect(() => {
    if (local || !meatId) return;
    let stale = false;
    void fetchNextTimeNote(meatId).then((note) => {
      if (!stale) setRemote({ meatId, note });
    });
    return () => {
      stale = true;
    };
  }, [local, meatId]);

  if (local) return local;
  return remote?.meatId === meatId && remote.note?.cookId !== excludeId ? remote.note : null;
};
