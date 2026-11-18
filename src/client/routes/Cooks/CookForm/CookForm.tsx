import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { CookWithEvents } from 'shared/types';
import Button from '@/components/Button/Button';
import Callout from '@/components/Callout/Callout';
import Field from '@/components/Field/Field';
import { FormPage, FormSection } from '@/components/FormPage/FormPage';
import MeatPicker from '@/components/MeatPicker/MeatPicker';
import type { CookFields } from '@/lib/cookActions';
import { useCooks } from '@/lib/cookHooks';
import { formatDay, fromLocalInput } from '@/lib/format';
import { findLastCook, useNextTimeNote } from '@/lib/nextTime';
import { useUnsaved } from '@/lib/unsaved';
import LastCookSummary from '../LastCookSummary/LastCookSummary';

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
  const { cooks, ready } = useCooks();
  const listId = useId();
  const defaulted = useRef(Boolean(initial));

  const initialValues = {
    meatId: initial?.meatId ?? '',
    weight: initial?.weightLbs?.toString() ?? '',
    targetInternal: initial?.targetInternalTempF?.toString() ?? '',
    targetPit: initial?.targetPitTempF?.toString() ?? '',
    wood: initial?.wood ?? '',
    prep: initial?.prep ?? '',
  };
  const [values, setValues] = useState(initialValues);
  const [baseline, setBaseline] = useState(initialValues);
  const [past, setPast] = useState(false);
  const [dates, setDates] = useState({ startedAt: '', endedAt: '' });
  const [triedSubmit, setTriedSubmit] = useState(false);

  const woods = useMemo(() => woodSuggestions(cooks), [cooks]);
  const nextTime = useNextTimeNote(values.meatId, initial?.id);
  const lastCook = useMemo(
    () => findLastCook(cooks, values.meatId, initial?.id),
    [cooks, values.meatId, initial?.id],
  );

  // New cooks start with the last cook's wood (once the cache has loaded).
  useEffect(() => {
    if (defaulted.current || !ready) return;
    defaulted.current = true;
    const fill = (v: typeof values) => ({ ...v, wood: v.wood || woods[0] || '' });
    setValues(fill);
    setBaseline(fill);
  }, [ready, woods]);

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

  let section = 0;

  return (
    <FormPage
      title={title}
      onSubmit={submit}
      submitLabel={initial ? submitLabel : past ? 'Continue to wrap-up' : submitLabel}
      submitDisabled={badRange}
      cancelFallback={initial ? `/cooks/${initial.id}` : '/'}
      notes={
        (nextTime || lastCook) && (
          <>
            {nextTime && (
              <Callout title="Next time">
                {`From your last ${nextTime.meatName.toLowerCase()}, ${formatDay(nextTime.endedAt)}: ${nextTime.nextTimeNote}`}
              </Callout>
            )}
            {lastCook && <LastCookSummary cook={lastCook} />}
          </>
        )
      }
    >
      <FormSection
        number={++section}
        title="The cook"
      >
        <MeatPicker
          wide
          label="Meat"
          value={values.meatId}
          onChange={(meatId) => setValues((v) => ({ ...v, meatId }))}
          error={triedSubmit && !values.meatId ? 'Choose a meat.' : undefined}
        />
        <Field
          label="Weight (lb)"
          inputMode="decimal"
          value={values.weight}
          onChange={set('weight')}
        />
        <Field
          label="Target meat temp (°F)"
          inputMode="numeric"
          placeholder="200"
          value={values.targetInternal}
          onChange={set('targetInternal')}
        />
        {!initial && (
          <Button
            wide
            type="button"
            variant="secondary"
            onClick={() => setPast((value) => !value)}
          >
            {past ? 'Start a live cook instead' : 'Log a past cook'}
          </Button>
        )}
      </FormSection>
      {past && (
        <FormSection
          number={++section}
          title="When"
        >
          <Field
            label="Started"
            type="datetime-local"
            value={dates.startedAt}
            onChange={(e) => setDates((d) => ({ ...d, startedAt: e.target.value }))}
            required
          />
          <Field
            label="Ended"
            type="datetime-local"
            value={dates.endedAt}
            onChange={(e) => setDates((d) => ({ ...d, endedAt: e.target.value }))}
            error={badRange ? 'End time is before the start time.' : undefined}
            required
          />
        </FormSection>
      )}
      <FormSection
        number={++section}
        title="Pit"
      >
        <Field
          label="Target pit temp (°F)"
          inputMode="numeric"
          placeholder="275"
          value={values.targetPit}
          onChange={set('targetPit')}
        />
        <Field
          label="Wood"
          list={`${listId}-wood`}
          value={values.wood}
          onChange={set('wood')}
        />
      </FormSection>
      <FormSection
        number={++section}
        title="Prep"
      >
        <Field
          wide
          multiline
          label="Prep"
          hint="Brine, injection, rub."
          value={values.prep}
          onChange={set('prep')}
        />
      </FormSection>
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
