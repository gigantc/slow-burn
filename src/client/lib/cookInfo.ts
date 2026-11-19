//////////////////////////////////////
// Cook facts derived from the record: its date, whether it's live, its one-line details.

import type { Cook, CookWithEvents } from 'shared/types';
import type { Entry } from '@/components/EntryLink/EntryLink';
import { formatDuration, formatMonthDay, fromLocalInput, localDate, nextDay } from '@/lib/format';

type DatedCook = Pick<Cook, 'cookedOn' | 'startedAt' | 'createdAt'>;

/** The local calendar date (YYYY-MM-DD) of a cook. A cook logged by date carries it as `cookedOn`. */
export const cookDate = (cook: DatedCook) =>
  cook.cookedOn ?? localDate(cook.startedAt ?? cook.createdAt);

/** Newest first: by date, then by the time of day where both cooks have one. */
export const compareCooks = (a: DatedCook, b: DatedCook) =>
  cookDate(b).localeCompare(cookDate(a)) ||
  (b.startedAt ?? b.createdAt).localeCompare(a.startedAt ?? a.createdAt);

/** On the pit right now: started in the app and not ended. Cooks logged after the fact never are. */
export const isLiveCook = (cook: Pick<Cook, 'source' | 'startedAt' | 'endedAt'>) =>
  cook.source === 'app' && cook.startedAt !== null && cook.endedAt === null;

/** "8.4 lb", wood and charcoal, whichever the cook has. */
export const cookDetails = (cook: Pick<Cook, 'weightLbs' | 'wood' | 'charcoal'>) =>
  [cook.weightLbs === null ? null : `${cook.weightLbs} lb`, cook.wood, cook.charcoal].flatMap(
    (part) => (part ? [part] : []),
  );

/** "Target 203° meat, 250° pit": whichever targets the cook has, or null. */
export const cookTargets = (
  cook: Pick<Cook, 'targetInternalTempF' | 'targetPitTempF'>,
): string | null => {
  const parts = [
    cook.targetInternalTempF ? `${cook.targetInternalTempF}° meat` : '',
    cook.targetPitTempF ? `${cook.targetPitTempF}° pit` : '',
  ].filter(Boolean);
  return parts.length > 0 ? `Target ${parts.join(', ')}` : null;
};

/** Distinct past values of a text field (wood, charcoal), most recent first, case-insensitive. */
export const pastValues = (cooks: readonly CookWithEvents[], key: 'wood' | 'charcoal') => {
  const seen = new Map<string, string>();
  for (const cook of cooks) {
    const value = cook[key]?.trim();
    if (value && !seen.has(value.toLowerCase())) seen.set(value.toLowerCase(), value);
  }
  return [...seen.values()];
};

/** A past cook as typed: a required date and optional clock times (HH:mm). */
export type PastDates = { date: string; start: string; end: string };

/** The cook fields for a past cook. An end at or before the start means it ran past midnight. */
export const pastTimes = ({ date, start, end }: PastDates) => {
  const startedAt = start ? fromLocalInput(`${date}T${start}`) : null;
  let endedAt = end ? fromLocalInput(`${date}T${end}`) : null;
  if (startedAt && endedAt && endedAt <= startedAt) {
    endedAt = fromLocalInput(`${nextDay(date)}T${end}`);
  }
  return { cookedOn: date, startedAt, endedAt };
};

/** A cook as a generic list entry: "Nov 8 · 11h 40m · Post oak". */
export const cookToEntry = (cook: CookWithEvents, meatName: string): Entry => ({
  id: cook.id,
  category: 'cook',
  name: meatName,
  meta: [
    formatMonthDay(cookDate(cook)),
    cook.startedAt && cook.endedAt
      ? formatDuration(new Date(cook.endedAt).getTime() - new Date(cook.startedAt).getTime())
      : null,
    ...cookDetails({ weightLbs: null, wood: cook.wood, charcoal: cook.charcoal }),
  ]
    .filter(Boolean)
    .join(' · '),
  rating: cook.rating ?? undefined,
  href: `/cooks/${cook.id}`,
});
