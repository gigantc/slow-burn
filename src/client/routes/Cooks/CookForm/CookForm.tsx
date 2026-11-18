import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { CookWithEvents } from 'shared/types';
import Button from '@/components/Button/Button';
import Callout from '@/components/Callout/Callout';
import Field from '@/components/Field/Field';
import type { CookFields } from '@/lib/cookActions';
import { useCooks } from '@/lib/cookHooks';
import { formatDay, fromLocalInput } from '@/lib/format';
import { useNextTimeNote } from '@/lib/nextTime';
import styles from './CookForm.module.scss';

export type Setup = Pick<
  CookFields,
  'name' | 'protein' | 'cut' | 'weightLbs' | 'prep' | 'smoker' | 'wood' | 'targetPitTempF'
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

const text = (value: string | null) => value ?? '';
const orNull = (value: string) => value.trim() || null;
const numberOrNull = (value: string) => {
  const n = Number(value);
  return value.trim() === '' || Number.isNaN(n) ? null : n;
};

/** Distinct past values of a field, most recent first, matched case-insensitively. */
const suggestions = (cooks: readonly CookWithEvents[], key: 'protein' | 'smoker' | 'wood') => {
  const seen = new Map<string, string>();
  for (const cook of cooks) {
    const value = cook[key]?.trim();
    if (value && !seen.has(value.toLowerCase())) seen.set(value.toLowerCase(), value);
  }
  return [...seen.values()];
};

const CookForm = ({ initial, title, submitLabel, onSave }: Props) => {
  const { cooks, ready } = useCooks();
  const listId = useId();
  const defaulted = useRef(Boolean(initial));

  const [values, setValues] = useState({
    name: text(initial?.name ?? null),
    protein: text(initial?.protein ?? null),
    cut: text(initial?.cut ?? null),
    weight: initial?.weightLbs?.toString() ?? '',
    prep: text(initial?.prep ?? null),
    smoker: text(initial?.smoker ?? null),
    wood: text(initial?.wood ?? null),
    target: initial?.targetPitTempF?.toString() ?? '',
  });
  const [past, setPast] = useState(false);
  const [dates, setDates] = useState({ startedAt: '', endedAt: '' });

  const smokers = useMemo(() => suggestions(cooks, 'smoker'), [cooks]);
  const woods = useMemo(() => suggestions(cooks, 'wood'), [cooks]);
  const proteins = useMemo(() => suggestions(cooks, 'protein'), [cooks]);
  const nextTime = useNextTimeNote(values.protein, initial?.id);

  // New cooks start with the last cook's smoker and wood (once the cache has loaded).
  useEffect(() => {
    if (defaulted.current || !ready) return;
    defaulted.current = true;
    setValues((v) => ({
      ...v,
      smoker: v.smoker || smokers[0] || '',
      wood: v.wood || woods[0] || '',
    }));
  }, [ready, smokers, woods]);

  const set = (key: keyof typeof values) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const badRange =
    past &&
    dates.startedAt !== '' &&
    dates.endedAt !== '' &&
    fromLocalInput(dates.endedAt) < fromLocalInput(dates.startedAt);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (badRange) return;
    onSave(
      {
        name: values.name.trim(),
        protein: orNull(values.protein),
        cut: orNull(values.cut),
        weightLbs: numberOrNull(values.weight),
        prep: orNull(values.prep),
        smoker: orNull(values.smoker),
        wood: orNull(values.wood),
        targetPitTempF: numberOrNull(values.target),
      },
      past ? dates : null,
    );
  };

  return (
    <form
      className={styles.form}
      onSubmit={submit}
    >
      <h1 className={styles.wide}>{title}</h1>
      {nextTime && (
        <Callout title="Next time">
          {`From your last ${values.protein.trim().toLowerCase()}, ${formatDay(nextTime.endedAt)}: ${nextTime.nextTimeNote}`}
        </Callout>
      )}
      <Field
        className={styles.wide}
        label="Name"
        placeholder="Thanksgiving turkey"
        value={values.name}
        onChange={set('name')}
        required
      />
      <Field
        label="Protein"
        list={`${listId}-protein`}
        placeholder="Turkey"
        value={values.protein}
        onChange={set('protein')}
      />
      <Field
        label="Cut"
        value={values.cut}
        onChange={set('cut')}
      />
      <Field
        label="Weight (lb)"
        inputMode="decimal"
        value={values.weight}
        onChange={set('weight')}
      />
      <Field
        label="Target pit temp (°F)"
        inputMode="numeric"
        placeholder="275"
        value={values.target}
        onChange={set('target')}
      />
      <Field
        className={styles.wide}
        multiline
        label="Prep"
        hint="Brine, injection, rub."
        value={values.prep}
        onChange={set('prep')}
      />
      <Field
        label="Smoker"
        list={`${listId}-smoker`}
        value={values.smoker}
        onChange={set('smoker')}
      />
      <Field
        label="Wood"
        list={`${listId}-wood`}
        value={values.wood}
        onChange={set('wood')}
      />
      <datalist id={`${listId}-protein`}>
        {proteins.map((value) => (
          <option
            key={value}
            value={value}
          />
        ))}
      </datalist>
      <datalist id={`${listId}-smoker`}>
        {smokers.map((value) => (
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
      {past && (
        <>
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
        </>
      )}
      <div className={styles.actions}>
        <Button
          type="submit"
          disabled={badRange}
        >
          {past ? 'Save and wrap up' : submitLabel}
        </Button>
        {!initial && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setPast((value) => !value)}
          >
            {past ? 'Start a live cook instead' : 'Log a past cook'}
          </Button>
        )}
      </div>
    </form>
  );
};

export default CookForm;
