import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import type { CookWithEvents } from 'shared/types';
import Button from '@/components/Button/Button';
import Field from '@/components/Field/Field';
import { FormPage, FormSection } from '@/components/FormPage/FormPage';
import RatingInput from '@/components/RatingInput/RatingInput';
import Summary from '@/components/Summary/Summary';
import { saveCook } from '@/lib/cookActions';
import { latestEvent } from '@/lib/cookEvents';
import { useCook, useCooks, useMeatName } from '@/lib/cookHooks';
import { formatDuration, formatWhen, fromLocalInput, toLocalInput } from '@/lib/format';
import { useUnsaved } from '@/lib/unsaved';
import { useBack } from '@/lib/useBack';
import CookMissing from '../CookMissing/CookMissing';

const END_BEFORE_START = 'End time is before the start time.';

const WrapUpForm = ({ cook }: { cook: CookWithEvents }) => {
  const meatName = useMeatName(cook.meatId);
  const navigate = useNavigate();
  const back = useBack();
  // Editing a finished cook's wrap-up was pushed from the detail page, so saving goes back to it.
  const [editing] = useState(Boolean(cook.endedAt));
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

  const endIso = edited === null ? defaultEnd : fromLocalInput(edited);
  const total = cook.startedAt
    ? new Date(endIso).getTime() - new Date(cook.startedAt).getTime()
    : null;
  const invalid = total !== null && total < 0;

  useUnsaved(
    edited !== null ||
      finalTemp !== initialTemp ||
      rating !== cook.rating ||
      notes !== (cook.notes ?? '') ||
      nextTime !== (cook.nextTimeNote ?? ''),
  );

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
    if (editing) back(`/cooks/${cook.id}`);
    else navigate(`/cooks/${cook.id}`, { replace: true });
  };

  const rows: [string, string][] = [];
  if (cook.startedAt) rows.push(['Started', formatWhen(cook.startedAt)]);
  rows.push([
    'Total time',
    total === null ? 'Not started' : invalid ? 'Check end time' : formatDuration(total),
  ]);

  return (
    <FormPage
      title="Wrap-up"
      onSubmit={submit}
      submitLabel="Save"
      submitDisabled={invalid}
      cancelFallback={`/cooks/${cook.id}`}
      notes={
        <Summary
          title={meatName}
          rows={rows}
        />
      }
    >
      <FormSection
        number={1}
        title="Finish"
      >
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
      </FormSection>
      <FormSection
        number={2}
        title="Rating"
      >
        <RatingInput
          value={rating}
          onChange={setRating}
        />
      </FormSection>
      <FormSection
        number={3}
        title="Note to future you"
        highlight
      >
        <Field
          wide
          multiline
          label="Note"
          hint="Shown first the next time you cook this protein."
          value={nextTime}
          onChange={(e) => setNextTime(e.target.value)}
        />
      </FormSection>
      <FormSection
        number={4}
        title="Notes"
      >
        <Field
          wide
          multiline
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </FormSection>
    </FormPage>
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
