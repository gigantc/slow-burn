import type { CookWithEvents } from 'shared/types';
import type { EntryCardProps } from '@/components/Card/Card';
import { localDate } from '@/lib/format';

export const cookToCard = (cook: CookWithEvents): EntryCardProps => ({
  type: 'cook',
  title: cook.name,
  tags: [cook.weightLbs === null ? null : `${cook.weightLbs} lb`, cook.wood].flatMap((tag) =>
    tag ? [tag] : [],
  ),
  date: localDate(cook.startedAt ?? cook.createdAt),
  rating: cook.rating ?? undefined,
});
