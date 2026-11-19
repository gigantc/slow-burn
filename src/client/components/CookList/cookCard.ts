import type { CookWithEvents } from 'shared/types';
import type { EntryCardProps } from '@/components/Card/Card';
import type { Entry } from '@/components/EntryLink/EntryLink';
import { cookDate, cookDetails } from '@/lib/cookInfo';
import { formatDuration, formatMonthDay } from '@/lib/format';

export const cookToCard = (cook: CookWithEvents, meatName: string): EntryCardProps => ({
  type: 'cook',
  title: meatName,
  tags: cookDetails(cook),
  date: cookDate(cook),
  detail:
    cook.startedAt && cook.endedAt
      ? formatDuration(new Date(cook.endedAt).getTime() - new Date(cook.startedAt).getTime())
      : undefined,
  rating: cook.rating ?? undefined,
  href: `/cooks/${cook.id}`,
});

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
