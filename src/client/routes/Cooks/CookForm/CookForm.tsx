import { useId, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { CookWithEvents } from 'shared/types';
import Button from '@/components/Button/Button';
import Field from '@/components/Field/Field';
import { FieldGrid, FormPage } from '@/components/FormPage/FormPage';
import MeatPicker from '@/components/MeatPicker/MeatPicker';
import NextTime from '@/components/NextTime/NextTime';
import { PAST_COOKS_COUNT } from '@/config';
import type { CookFields } from '@/lib/cookActions';
import { useCooks, useMeatName } from '@/lib/cookHooks';
import { clockTime, formatMonthDay, fromLocalInput } from '@/lib/format';
import { findPastCooks, useNextTimeNote } from '@/lib/nextTime';
import { useUnsaved } from '@/lib/unsaved';
import { useNow } from '@/lib/useNow';
import PastCooks from '../PastCooks/PastCooks';

export type Setup = Pick<
  CookFields,
  'meatId' | 'weightLbs' | 'targetInternalTempF' | 'targetPitTempF' | 'wood' | 'prep'
>;

/** Local datetime-local values for a cook that is already finished. */
export type PastDates = { startedAt: string; endedAt: string };

type Props = {
  /** Present when editing; absent for a new cook. */
  initial?: CookWithEvents;
  title: string;
  submitLabel: string;
  onSave: (setup: Setup, past: PastDates | null) => void;
};

const orNull = (value: string) => value.trim() || null;
const numberOrNull = (value: string) => {
  const n = Number(value);
  return value.trim() === '' || Number.isNaN(n) ? null : n;
};

/** Distinct past wood values, most recent first, matched case-insensitively. */
const woodSuggestions = (cooks: readonly CookWithEvents[]) => {
  const seen = new Map<string, string>();
  for (const cook of cooks) {
    const value = cook.wood?.trim();
    if (value && !seen.has(value.toLowerCase())) seen.set(value.toLowerCase(), value);
  }
  return [...seen.values()];
};

const CookForm = ({ initial, title, submitLabel, onSave }: Props) => {
  const { cooks } = useCooks();
  const listId = useId();

  const initialValues = {
    meatId: initial?.meatId ?? '',
    weight: initial?.weightLbs?.toString() ?? '',
    targetInternal: initial?.targetInternalTempF?.toString() ?? '',
    targetPit: initial?.targetPitTempF?.toString() ?? '',
    wood: initial?.wood ?? '',
    prep: initial?.prep ?? '',
  };
  const [values, setValues] = useState(initialValues);
  const [baseline] = useState(initialValues);
  const [past, setPast] = useState(false);
  const [dates, setDates] = useState({ startedAt: '', endedAt: '' });
  const [triedSubmit, setTriedSubmit] = useState(false);

  const woods = useMemo(() => woodSuggestions(cooks), [cooks]);
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

  const badRange =
    past &&
    dates.startedAt !== '' &&
    dates.endedAt !== '' &&
    fromLocalInput(dates.endedAt) < fromLocalInput(dates.startedAt);

  useUnsaved(past || JSON.stringify(values) !== JSON.stringify(baseline));

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
      submitDisabled={badRange}
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
            source={`From your ${nextTime.meatName.toLowerCase()} on ${formatMonthDay(nextTime.endedAt)}`}
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
        <FieldGrid wide>
          <Field
            label="Start time"
            type="datetime-local"
            value={dates.startedAt}
            onChange={(e) => setDates((d) => ({ ...d, startedAt: e.target.value }))}
            required
          />
          <Field
            label="End time"
            type="datetime-local"
            value={dates.endedAt}
            onChange={(e) => setDates((d) => ({ ...d, endedAt: e.target.value }))}
            error={badRange ? 'End time is before the start time.' : undefined}
            required
          />
        </FieldGrid>
      )}
      <FieldGrid>
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
        <Field
          label="Wood"
          list={`${listId}-wood`}
          value={values.wood}
          onChange={set('wood')}
        />
      </FieldGrid>
      <Field
        multiline
        label="Prep"
        rows={3}
        placeholder="Rub, injection, trim, overnight dry brine..."
        value={values.prep}
        onChange={set('prep')}
      />
      {!initial && (
        <Button
          type="button"
          variant="secondary"
          onClick={() => setPast((value) => !value)}
        >
          {past ? 'Start a live cook instead' : 'Log a past cook'}
        </Button>
      )}
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
