import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import type { CookWithEvents } from 'shared/types';
import Field from '@/components/Field/Field';
import { FieldGrid, FormPage } from '@/components/FormPage/FormPage';
import NextTime from '@/components/NextTime/NextTime';
import RatingInput from '@/components/RatingInput/RatingInput';
import StatTile, { StatTiles } from '@/components/StatTile/StatTile';
import { saveCook } from '@/lib/cookActions';
import { latestEvent } from '@/lib/cookEvents';
import { useCook, useCooks, useMeatName } from '@/lib/cookHooks';
import { formatDuration, fromLocalInput, toLocalInput } from '@/lib/format';
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
  const endMs = new Date(endIso).getTime();
  const total = cook.startedAt ? endMs - new Date(cook.startedAt).getTime() : null;
  const invalid = total !== null && total < 0;
  // Rested runs from the logged Rest event to the end; no Rest event, no stat.
  const restEvent = latestEvent(cook.events, 'rest');
  const rested = restEvent ? endMs - new Date(restEvent.at).getTime() : null;
  const temp = Number(finalTemp);
  const hasTemp = finalTemp.trim() !== '' && !Number.isNaN(temp);

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
    saveCook({
      id: cook.id,
      endedAt: endIso,
      finalInternalTempF: hasTemp ? temp : null,
      rating,
      notes: notes.trim() || null,
      nextTimeNote: nextTime.trim() || null,
    });
    if (editing) back(`/cooks/${cook.id}`);
    else navigate(`/cooks/${cook.id}`, { replace: true });
  };

  return (
    <FormPage
      title="How'd it go?"
      onSubmit={submit}
      submitLabel="Save cook"
      submitDisabled={invalid}
      cancelFallback={`/cooks/${cook.id}`}
      cancelLabel="Back to cook"
      barCancel={false}
      crumb={{ to: `/cooks/${cook.id}`, label: meatName, current: 'Wrap up' }}
      meta={meatName}
    >
      <StatTiles>
        <StatTile
          label="Total time"
          value={total === null ? '--' : invalid ? 'Check end' : formatDuration(total)}
        />
        {rested !== null && rested >= 0 && (
          <StatTile
            label="Rested"
            value={formatDuration(rested)}
          />
        )}
      </StatTiles>
      <FieldGrid wide>
        <Field
          label="End time"
          type="datetime-local"
          value={edited ?? toLocalInput(defaultEnd)}
          onChange={(e) => setEdited(e.target.value)}
          error={invalid ? END_BEFORE_START : undefined}
          required
        />
        <Field
          label="Final temp"
          unit="°F"
          inputMode="decimal"
          value={finalTemp}
          onChange={(e) => setFinalTemp(e.target.value)}
        />
      </FieldGrid>
      <RatingInput
        value={rating}
        onChange={setRating}
      />
      <Field
        multiline
        label="Notes"
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <NextTime
        variant="field"
        hint={`Shown first when you start your next ${meatName.toLowerCase()}.`}
        value={nextTime}
        onChange={(e) => setNextTime(e.target.value)}
      />
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
