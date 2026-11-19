//////////////////////////////////////
// Meat helpers

import type { CookWithEvents, Meat } from 'shared/types';

/**
 * Meats ordered as staples: most cooks first; ties go to the one cooked longest ago (so a
 * staple you haven't made in a while comes up first); meats with no cooks last, by name.
 */
export const rankStaples = (meats: readonly Meat[], cooks: readonly CookWithEvents[]): Meat[] => {
  const stats = new Map<string, { count: number; latest: string }>();
  for (const cook of cooks) {
    const when = cook.startedAt ?? cook.createdAt;
    const entry = stats.get(cook.meatId) ?? { count: 0, latest: when };
    entry.count += 1;
    if (when > entry.latest) entry.latest = when;
    stats.set(cook.meatId, entry);
  }

  return [...meats].sort((a, b) => {
    const sa = stats.get(a.id);
    const sb = stats.get(b.id);
    return (
      (sb?.count ?? 0) - (sa?.count ?? 0) ||
      (sa && sb ? sa.latest.localeCompare(sb.latest) : 0) ||
      a.name.localeCompare(b.name)
    );
  });
};
