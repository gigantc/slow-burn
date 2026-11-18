//////////////////////////////////////
// Next-time note lookup
// Local cache first (works offline), same match rule as the server's protein_key; the API is
// only a fallback for notes that are not cached yet.

import { useEffect, useMemo, useState } from 'react';
import type { CookWithEvents, NextTimeNote } from 'shared/types';
import { useCooks } from '@/lib/cookHooks';
import { fetchNextTimeNote } from '@/lib/cookActions';

const normalize = (protein: string | null) => protein?.trim().toLowerCase() ?? '';

export const findNextTimeNote = (
  cooks: readonly CookWithEvents[],
  protein: string,
  excludeId?: string,
): NextTimeNote | null => {
  const key = normalize(protein);
  if (!key) return null;

  let best: NextTimeNote | null = null;
  for (const cook of cooks) {
    const note = cook.nextTimeNote?.trim();
    if (cook.id === excludeId || !cook.endedAt || !note || normalize(cook.protein) !== key)
      continue;
    if (!best || cook.endedAt > best.endedAt) {
      best = { cookId: cook.id, name: cook.name, endedAt: cook.endedAt, nextTimeNote: note };
    }
  }
  return best;
};

export const useNextTimeNote = (protein: string, excludeId?: string): NextTimeNote | null => {
  const { cooks } = useCooks();
  const local = useMemo(
    () => findNextTimeNote(cooks, protein, excludeId),
    [cooks, protein, excludeId],
  );
  const [remote, setRemote] = useState<{ key: string; note: NextTimeNote | null } | null>(null);
  const key = normalize(protein);

  useEffect(() => {
    if (local || !key) return;
    let stale = false;
    const timer = setTimeout(() => {
      void fetchNextTimeNote(protein).then((note) => {
        if (!stale) setRemote({ key, note });
      });
    }, 400);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [local, key, protein]);

  if (local) return local;
  return remote?.key === key && remote.note?.cookId !== excludeId ? remote.note : null;
};
