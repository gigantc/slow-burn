//////////////////////////////////////
// Live cook numbers

import type { CookEvent } from 'shared/types';
import { readings } from '@/lib/cookEvents';

/** The pit's latest reading as a share of its target (0 to 1). */
export const pitProgress = (latest: number | null, target: number | null) =>
  latest === null || !target ? 0 : Math.min(1, Math.max(0, latest / target));

/** How far the meat has come from its first reading to the target (0 to 1). */
export const meatProgress = (events: readonly CookEvent[], target: number | null) => {
  const list = readings(events, 'internal_temp');
  const first = list[0]?.value ?? null;
  const latest = list[list.length - 1]?.value ?? null;
  if (first === null || latest === null || !target) return 0;
  if (target <= first) return 1;
  return Math.min(1, Math.max(0, (latest - first) / (target - first)));
};
