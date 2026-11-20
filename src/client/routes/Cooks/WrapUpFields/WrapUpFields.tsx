import { useState } from 'react';
import type { CookWithEvents } from 'shared/types';
import Field from '@/components/Field/Field';
import { FieldGrid } from '@/components/FormPage/FormPage';
import NextTime from '@/components/NextTime/NextTime';
import RatingInput from '@/components/RatingInput/RatingInput';
import { latestEvent } from '@/lib/cookEvents';
import { useMeatName } from '@/lib/cookHooks';
import { fromLocalInput, toLocalInput } from '@/lib/format';
import styles from './WrapUpFields.module.scss';

export const END_BEFORE_START = 'End time is before the start time.';

/**
 * The state of a cook's wrap-up (end time, final temp, rating, notes, next time), shared by the
 * wrap-up screen and the edit screen. `fields` is what to hand to `saveCook`.
 */
export const useWrapUp = (cook: CookWithEvents) => {
  // A cook logged after the fact keeps whatever times it has; only live cooks get an end time.
  const past = cook.source === 'import';
  // The default end keeps full precision. The input only shows minutes, and truncating "now"
  // could land it before a start time that has seconds. An edited value replaces it.
  const [defaultEnd] = useState(() => cook.endedAt ?? new Date().toISOString());
  const [edited, setEdited] = useState<string | null>(null);
  const initialTemp =
    (cook.finalInternalTempF ?? latestEvent(cook.events, 'internal_temp')?.value)?.toString() ?? '';
  const [finalTemp, setFinalTemp] = useState(initialTemp);
  const [rating, setRating] = useState(cook.rating);
  const [notes, setNotes] = useState(cook.notes ?? '');
  const [nextTime, setNextTime] = useState(cook.nextTimeNote ?? '');

  const endIso = past ? cook.endedAt : edited === null ? defaultEnd : fromLocalInput(edited);
  const endMs = endIso ? new Date(endIso).getTime() : null;
  const total =
    cook.startedAt && endMs !== null ? endMs - new Date(cook.startedAt).getTime() : null;
  // Rested runs from the logged Rest event to the end; no Rest event, no stat.
  const restEvent = latestEvent(cook.events, 'rest');
  const rested = restEvent && endMs !== null ? endMs - new Date(restEvent.at).getTime() : null;
  const temp = Number(finalTemp);
  const hasTemp = finalTemp.trim() !== '' && !Number.isNaN(temp);

  return {
    past,
    endValue: edited ?? toLocalInput(defaultEnd),
    setEdited,
    finalTemp,
    setFinalTemp,
    rating,
    setRating,
    notes,
    setNotes,
    nextTime,
    setNextTime,
    total,
    rested,
    invalid: total !== null && total < 0,
    dirty:
      edited !== null ||
      finalTemp !== initialTemp ||
      rating !== cook.rating ||
      notes !== (cook.notes ?? '') ||
      nextTime !== (cook.nextTimeNote ?? ''),
    fields: {
      endedAt: endIso,
      finalInternalTempF: hasTemp ? temp : null,
      rating,
      notes: notes.trim() || null,
      nextTimeNote: nextTime.trim() || null,
    },
  };
};

type Props = {
  wrap: ReturnType<typeof useWrapUp>;
  meatName: string;
  /** A heading above the fields, for a screen where they follow other fields. */
  title?: string;
};

/** The wrap-up form fields. Render inside a FormPage. */
export const WrapUpFields = ({ wrap, meatName, title }: Props) => (
  <>
    {title && <h2 className={styles.title}>{title}</h2>}
    <FieldGrid wide>
      {!wrap.past && (
        <Field
          label="End time"
          type="datetime-local"
          value={wrap.endValue}
          onChange={(e) => wrap.setEdited(e.target.value)}
          error={wrap.invalid ? END_BEFORE_START : undefined}
          required
        />
      )}
      <Field
        label="Final meat temp"
        unit="°F"
        inputMode="decimal"
        value={wrap.finalTemp}
        onChange={(e) => wrap.setFinalTemp(e.target.value)}
      />
    </FieldGrid>
    <RatingInput
      value={wrap.rating}
      onChange={wrap.setRating}
    />
    <Field
      multiline
      label="Notes"
      value={wrap.notes}
      onChange={(e) => wrap.setNotes(e.target.value)}
    />
    <NextTime
      variant="field"
      hint={`Shown first when you start your next ${meatName.toLowerCase()}.`}
      value={wrap.nextTime}
      onChange={(e) => wrap.setNextTime(e.target.value)}
    />
  </>
);
