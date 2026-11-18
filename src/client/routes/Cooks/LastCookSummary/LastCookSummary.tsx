import type { ReactNode } from 'react';
import type { CookWithEvents } from 'shared/types';
import Stars from '@/components/Stars/Stars';
import Summary from '@/components/Summary/Summary';
import { useMeatName } from '@/lib/cookHooks';
import { formatDay, formatDuration } from '@/lib/format';

/** A compact look at the previous cook of the same protein, from the local cache. */
const LastCookSummary = ({ cook }: { cook: CookWithEvents }) => {
  const meatName = useMeatName(cook.meatId);
  const rows: [string, ReactNode][] = [];
  if (cook.endedAt) rows.push(['Date', formatDay(cook.endedAt)]);
  if (cook.weightLbs !== null) rows.push(['Weight', `${cook.weightLbs} lb`]);
  if (cook.startedAt && cook.endedAt) {
    const ms = new Date(cook.endedAt).getTime() - new Date(cook.startedAt).getTime();
    rows.push(['Total time', formatDuration(ms)]);
  }
  if (cook.rating !== null) rows.push(['Rating', <Stars rating={cook.rating} />]);

  return (
    <Summary
      title={`Last ${meatName.toLowerCase()}`}
      rows={rows}
      collapse
    />
  );
};

export default LastCookSummary;
