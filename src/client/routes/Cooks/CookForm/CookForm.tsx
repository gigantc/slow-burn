import { useId, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import type { CookWithEvents } from 'shared/types';
import Button from '@/components/Button/Button';
import Field from '@/components/Field/Field';
import { FieldGrid, FormPage } from '@/components/FormPage/FormPage';
import MeatPicker from '@/components/MeatPicker/MeatPicker';
import NextTime from '@/components/NextTime/NextTime';
import { PAST_COOKS_COUNT } from '@/config';
import type { CookFields } from '@/lib/cookActions';
import { useCooks, useMeatName } from '@/lib/cookHooks';
import { pastValues } from '@/lib/cookInfo';
import type { PastDates } from '@/lib/cookInfo';
import { clockTime, formatMonthDay, toLocalInput, today } from '@/lib/format';
import { findPastCooks, useNextTimeNote } from '@/lib/nextTime';
import { useUnsaved } from '@/lib/unsaved';
import { useNow } from '@/lib/useNow';
import PastCooks from '../PastCooks/PastCooks';

export type Setup = Pick<
  CookFields,
  'meatId' | 'weightLbs' | 'targetInternalTempF' | 'targetPitTempF' | 'wood' | 'charcoal' | 'prep'
>;

type Props = {
  /** Present when editing; absent for a new cook. */
  initial?: CookWithEvents;
  title: string;
  submitLabel: string;
  /** `past` is set for a cook logged after the fact (a date, optionally with times). */
  onSave: (setup: Setup, past: PastDates | null) => void;
  /** Wrap-up fields for a finished cook, shown after the setup. The screen holds their state. */
  wrapUp?: { fields: ReactNode; dirty: boolean; invalid: boolean };
};

const orNull = (value: string) => value.trim() || null;
const numberOrNull = (value: string) => {
  const n = Number(value);
  return value.trim() === '' || Number.isNaN(n) ? null : n;
};

const CookForm = ({ initial, title, submitLabel, onSave, wrapUp }: Props) => {
  const { cooks } = useCooks();
  const listId = useId();

  const initialValues = {
    meatId: initial?.meatId ?? '',
    weight: initial?.weightLbs?.toString() ?? '',
    targetInternal: initial?.targetInternalTempF?.toString() ?? '',
    targetPit: initial?.targetPitTempF?.toString() ?? '',
    wood: initial?.wood ?? '',
    charcoal: initial?.charcoal ?? '',
    prep: initial?.prep ?? '',
  };
  const [values, setValues] = useState(initialValues);
  const [baseline] = useState(initialValues);
  // A cook logged by date (new, or edited later) shows a date and optional times.
  const initialDates: PastDates = {
    date: initial?.cookedOn ?? '',
    start: initial?.startedAt && initial.cookedOn ? toLocalInput(initial.startedAt).slice(11) : '',
    end: initial?.endedAt && initial.cookedOn ? toLocalInput(initial.endedAt).slice(11) : '',
  };
  const [past, setPast] = useState(Boolean(initial?.cookedOn));
  const [dates, setDates] = useState(initialDates);
  const [triedSubmit, setTriedSubmit] = useState(false);

  const woods = useMemo(() => pastValues(cooks, 'wood'), [cooks]);
  const charcoals = useMemo(() => pastValues(cooks, 'charcoal'), [cooks]);
  const initialMeatName = useMeatName(initial?.meatId);
  const nextTime = useNextTimeNote(values.meatId, initial?.id);
  const pastCooks = useMemo(
    () => findPastCooks(cooks, values.meatId, initial?.id),
    [cooks, values.meatId, initial?.id],
  );
  const meatName = useMeatName(values.meatId);
  const now = useNow(60_000);

  const set = (key: keyof typeof values) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  // Times are optional; an end earlier than the start means the cook ran past midnight, so only
  // an identical start and end is wrong.
  const badRange = past && dates.start !== '' && dates.start === dates.end;

  useUnsaved(
    (!initial && past) ||
      Boolean(wrapUp?.dirty) ||
      JSON.stringify(values) !== JSON.stringify(baseline) ||
      JSON.stringify(dates) !== JSON.stringify(initialDates),
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTriedSubmit(true);
    if (badRange || !values.meatId) return;
    onSave(
      {
        meatId: values.meatId,
        weightLbs: numberOrNull(values.weight),
        targetInternalTempF: numberOrNull(values.targetInternal),
        targetPitTempF: numberOrNull(values.targetPit),
        wood: orNull(values.wood),
        charcoal: orNull(values.charcoal),
        prep: orNull(values.prep),
      },
      past ? dates : null,
    );
  };

  return (
    <FormPage
      title={title}
      onSubmit={submit}
      submitLabel={initial ? submitLabel : past ? 'Continue to wrap-up' : submitLabel}
      submitDisabled={badRange || Boolean(wrapUp?.invalid)}
      cancelFallback={initial ? `/cooks/${initial.id}` : '/'}
      crumb={initial ? { to: `/cooks/${initial.id}`, label: initialMeatName } : undefined}
      meta={
        initial ? undefined : `${formatMonthDay(new Date(now).toISOString())} · ${clockTime(now)}`
      }
      lead={
        <MeatPicker
          label="Meat"
          value={values.meatId}
          onChange={(meatId) => setValues((v) => ({ ...v, meatId }))}
          error={triedSubmit && !values.meatId ? 'Choose a meat.' : undefined}
        />
      }
      notes={
        nextTime && (
          <NextTime
            source={`From your ${nextTime.meatName.toLowerCase()} on ${formatMonthDay(nextTime.date)}`}
            rating={cooks.find((cook) => cook.id === nextTime.cookId)?.rating ?? undefined}
          >
            {nextTime.nextTimeNote}
          </NextTime>
        )
      }
      extra={
        pastCooks.length > 0 && (
          <PastCooks
            meatName={meatName}
            cooks={pastCooks.slice(0, PAST_COOKS_COUNT)}
          />
        )
      }
    >
      {past && (
        <>
          <Field
            label="Date"
            type="date"
            max={today()}
            value={dates.date}
            onChange={(e) => setDates((d) => ({ ...d, date: e.target.value }))}
            required
          />
          <FieldGrid>
            <Field
              label="Start time (optional)"
              type="time"
              value={dates.start}
              onChange={(e) => setDates((d) => ({ ...d, start: e.target.value }))}
            />
            <Field
              label="End time (optional)"
              type="time"
              value={dates.end}
              onChange={(e) => setDates((d) => ({ ...d, end: e.target.value }))}
              error={badRange ? 'End time is the same as the start time.' : undefined}
            />
          </FieldGrid>
        </>
      )}
      <FieldGrid threeUp>
        <Field
          label="Weight"
          unit="lb"
          inputMode="decimal"
          placeholder="0"
          value={values.weight}
          onChange={set('weight')}
        />
        <Field
          label="Target meat"
          unit="°F"
          inputMode="numeric"
          placeholder="0"
          value={values.targetInternal}
          onChange={set('targetInternal')}
        />
        <Field
          label="Target pit"
          unit="°F"
          inputMode="numeric"
          placeholder="0"
          value={values.targetPit}
          onChange={set('targetPit')}
        />
      </FieldGrid>
      <FieldGrid>
        <Field
          label="Wood"
          list={`${listId}-wood`}
          value={values.wood}
          onChange={set('wood')}
        />
        <Field
          label="Charcoal"
          list={`${listId}-charcoal`}
          value={values.charcoal}
          onChange={set('charcoal')}
        />
      </FieldGrid>
      <Field
        multiline
        label="Prep"
        placeholder="Rub, injection, trim, overnight dry brine..."
        value={values.prep}
        onChange={set('prep')}
      />
      {wrapUp?.fields}
      {!initial && (
        <Button
          type="button"
          variant="secondary"
          onClick={() => setPast((value) => !value)}
        >
          {past ? 'Start a live cook instead' : 'Log a past cook'}
        </Button>
      )}
      <datalist id={`${listId}-charcoal`}>
        {charcoals.map((value) => (
          <option
            key={value}
            value={value}
          />
        ))}
      </datalist>
      <datalist id={`${listId}-wood`}>
        {woods.map((value) => (
          <option
            key={value}
            value={value}
          />
        ))}
      </datalist>
    </FormPage>
  );
};

export default CookForm;
