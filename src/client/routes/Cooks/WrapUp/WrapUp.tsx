import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import type { CookWithEvents } from 'shared/types';
import Button from '@/components/Button/Button';
import Field from '@/components/Field/Field';
import RatingInput from '@/components/RatingInput/RatingInput';
import { saveCook } from '@/lib/cookActions';
import { latestEvent } from '@/lib/cookEvents';
import { useCook, useCooks } from '@/lib/cookHooks';
import { formatDuration, fromLocalInput, toLocalInput } from '@/lib/format';

const END_BEFORE_START = 'End time is before the start time.';
import CookMissing from '../CookMissing/CookMissing';
import styles from './WrapUp.module.scss';

const WrapUpForm = ({ cook }: { cook: CookWithEvents }) => {
  const navigate = useNavigate();
  // The default end keeps full precision. The input only shows minutes, and truncating "now"
  // could land it before a start time that has seconds. An edited value replaces it.
  const [defaultEnd] = useState(() => cook.endedAt ?? new Date().toISOString());
  const [edited, setEdited] = useState<string | null>(null);
  const [finalTemp, setFinalTemp] = useState(
    () =>
      (cook.finalInternalTempF ?? latestEvent(cook.events, 'internal_temp')?.value)?.toString() ??
      '',
  );
  const [rating, setRating] = useState(cook.rating);
  const [notes, setNotes] = useState(cook.notes ?? '');
  const [nextTime, setNextTime] = useState(cook.nextTimeNote ?? '');

  const endIso = edited === null ? defaultEnd : fromLocalInput(edited);
  const total = cook.startedAt
    ? new Date(endIso).getTime() - new Date(cook.startedAt).getTime()
    : null;
  const invalid = total !== null && total < 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (invalid) return;
    const temp = Number(finalTemp);
    saveCook({
      id: cook.id,
      endedAt: endIso,
      finalInternalTempF: finalTemp.trim() === '' || Number.isNaN(temp) ? null : temp,
      rating,
      notes: notes.trim() || null,
      nextTimeNote: nextTime.trim() || null,
    });
    navigate(`/cooks/${cook.id}`);
  };

  return (
    <form
      className={styles.wrap}
      onSubmit={submit}
    >
      <h1>Wrap-up</h1>
      {total !== null && !invalid && (
        <p className={styles.total}>
          Total time: <strong>{formatDuration(total)}</strong>
        </p>
      )}
      <Field
        label="Ended"
        type="datetime-local"
        value={edited ?? toLocalInput(defaultEnd)}
        onChange={(e) => setEdited(e.target.value)}
        error={invalid ? END_BEFORE_START : undefined}
        required
      />
      <Field
        label="Final internal temp (°F)"
        inputMode="decimal"
        value={finalTemp}
        onChange={(e) => setFinalTemp(e.target.value)}
      />
      <RatingInput
        value={rating}
        onChange={setRating}
      />
      <Field
        className={styles.future}
        multiline
        label="Note to future you"
        hint="Shown first the next time you cook this protein."
        value={nextTime}
        onChange={(e) => setNextTime(e.target.value)}
      />
      <Field
        multiline
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <Button
        type="submit"
        disabled={invalid}
      >
        Save
      </Button>
    </form>
  );
};

const WrapUp = () => {
  const { id } = useParams();
  const cook = useCook(id);
  const { ready } = useCooks();

  if (!cook) return ready ? <CookMissing /> : null;
  return <WrapUpForm cook={cook} />;
};

export default WrapUp;
