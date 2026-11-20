import { useState } from 'react';
import type { FormEvent } from 'react';
import type { CookEventTypeKey } from 'shared/cookEventTypes';
import type { CookEvent, CookWithEvents } from 'shared/types';
import Button from '@/components/Button/Button';
import Field from '@/components/Field/Field';
import Sheet from '@/components/Sheet/Sheet';
import { addEvent, updateEvent } from '@/lib/cookActions';
import { eventDef, latestEvent } from '@/lib/cookEvents';
import { fromLocalInput, shiftLocalInput, toLocalInput } from '@/lib/format';
import styles from './EventSheet.module.scss';

export type EventTarget =
  { mode: 'log'; type: CookEventTypeKey } | { mode: 'edit'; event: CookEvent };

type Props = {
  cook: CookWithEvents;
  target: EventTarget | null;
  onClose: () => void;
  onLogged: (event: CookEvent) => void;
  onDelete: (event: CookEvent) => void;
};

const QUICK_MINUTES = [5, 10, 15];

type FormProps = Omit<Props, 'target'> & { target: EventTarget };

// Mounted fresh for every target (keyed by the parent), so its state starts from the event.
const EventForm = ({ cook, target, onClose, onLogged, onDelete }: FormProps) => {
  const editing = target.mode === 'edit';
  const type = editing ? target.event.type : target.type;
  const def = eventDef(type);
  const last = editing ? undefined : latestEvent(cook.events, type);

  const [value, setValue] = useState(
    (editing ? target.event.value : last?.value)?.toString() ?? '',
  );
  const [note, setNote] = useState(editing ? (target.event.note ?? '') : '');
  const [time, setTime] = useState(editing ? toLocalInput(target.event.at) : '');

  const shift = (minutes: number) => setTime((current) => shiftLocalInput(current, minutes));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const numeric = value.trim() === '' || Number.isNaN(Number(value)) ? null : Number(value);
    const trimmed = note.trim() || null;

    if (target.mode === 'edit') {
      // An untouched time keeps its seconds; the input only has minute precision.
      const untouched = time === toLocalInput(target.event.at);
      updateEvent(cook.id, target.event.id, {
        at: untouched ? target.event.at : fromLocalInput(time),
        value: numeric,
        note: trimmed,
      });
      onClose();
      return;
    }
    onLogged(addEvent(cook.id, { type, value: numeric, note: trimmed }));
    onClose();
  };

  return (
    <form
      className={styles.form}
      onSubmit={submit}
    >
      <h2>{editing ? `Edit ${def.label.toLowerCase()}` : def.label}</h2>
      {editing && (
        <>
          <Field
            label="Time"
            type="datetime-local"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
          <div
            className={styles.quick}
            role="group"
            aria-label="Move earlier"
          >
            {QUICK_MINUTES.map((minutes) => (
              <Button
                size="lg"
                key={minutes}
                type="button"
                variant="secondary"
                onClick={() => shift(minutes)}
              >
                {`-${minutes} min`}
              </Button>
            ))}
          </div>
        </>
      )}
      {def.value && (
        <Field
          className={styles.value}
          label={`${def.label} (${def.value.unit})`}
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          data-autofocus
          required={!editing}
        />
      )}
      {(editing || def.takesNote) && (
        <Field
          multiline
          short
          label="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          data-autofocus={def.takesNote && !def.value ? true : undefined}
          required={def.takesNote && !editing}
        />
      )}
      <Button
        type="submit"
        size="lg"
      >
        Save
      </Button>
      {target.mode === 'edit' && (
        <Button
          size="lg"
          type="button"
          variant="danger"
          onClick={() => onDelete(target.event)}
        >
          Delete
        </Button>
      )}
    </form>
  );
};

const EventSheet = (props: Props) => {
  const { target, onClose } = props;
  const key = target ? (target.mode === 'edit' ? target.event.id : `log-${target.type}`) : 'none';

  return (
    <Sheet
      open={target !== null}
      onClose={onClose}
      label="Log event"
    >
      {target && (
        <EventForm
          key={key}
          {...props}
          target={target}
        />
      )}
    </Sheet>
  );
};

export default EventSheet;
