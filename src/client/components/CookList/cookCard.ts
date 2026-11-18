import type { CookWithEvents } from 'shared/types';
import type { EntryCardProps } from '@/components/Card/Card';
import { formatDuration, localDate } from '@/lib/format';

export const cookTags = (cook: CookWithEvents) =>
  [cook.weightLbs === null ? null : `${cook.weightLbs} lb`, cook.wood].flatMap((tag) =>
    tag ? [tag] : [],
  );

export const cookToCard = (cook: CookWithEvents, meatName: string): EntryCardProps => ({
  type: 'cook',
  title: meatName,
  tags: cookTags(cook),
  date: localDate(cook.startedAt ?? cook.createdAt),
  detail:
    cook.startedAt && cook.endedAt
      ? formatDuration(new Date(cook.endedAt).getTime() - new Date(cook.startedAt).getTime())
      : undefined,
  rating: cook.rating ?? undefined,
  href: `/cooks/${cook.id}`,
});
