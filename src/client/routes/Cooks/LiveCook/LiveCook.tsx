import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import type { CookEventTypeKey } from 'shared/cookEventTypes';
import type { CookEvent, CookWithEvents } from 'shared/types';
import Button from '@/components/Button/Button';
import ConfirmSheet from '@/components/ConfirmSheet/ConfirmSheet';
import SyncStatus from '@/components/SyncStatus/SyncStatus';
import UndoToast from '@/components/UndoToast/UndoToast';
import type { Toast } from '@/components/UndoToast/UndoToast';
import { addEvent, deleteEvent } from '@/lib/cookActions';
import { eventDef, eventTypeDefs, formatValue, latestEvent } from '@/lib/cookEvents';
import { formatDuration, timeAgo } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { useWakeLock } from '@/lib/useWakeLock';
import EventSheet from '../EventSheet/EventSheet';
import type { EventTarget } from '../EventSheet/EventSheet';
import Timeline from '../Timeline/Timeline';
import styles from './LiveCook.module.scss';

const LiveCook = ({ cook }: { cook: CookWithEvents }) => {
  useWakeLock();
  const now = useNow(30_000);
  const navigate = useNavigate();
  const [target, setTarget] = useState<EventTarget | null>(null);
  const [deleting, setDeleting] = useState<CookEvent | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const pit = latestEvent(cook.events, 'pit_temp');
  const internal = latestEvent(cook.events, 'internal_temp');
  const last = latestEvent(cook.events);
  const started = cook.startedAt ? new Date(cook.startedAt).getTime() : now;

  const announce = (event: CookEvent) =>
    setToast({ id: event.id, message: `${eventDef(event.type).label} logged` });

  const tap = (type: CookEventTypeKey) => {
    const def = eventDef(type);
    if (def.value || def.takesNote) setTarget({ mode: 'log', type });
    else announce(addEvent(cook.id, { type }));
  };

  const undo = () => {
    if (toast) deleteEvent(cook.id, toast.id);
    setToast(null);
  };

  const glance = [
    { label: 'Pit temp', event: pit, value: pit ? formatValue(pit) : 'None yet' },
    { label: 'Internal', event: internal, value: internal ? formatValue(internal) : 'None yet' },
    { label: 'Last', event: last, value: last ? eventDef(last.type).label : 'None yet' },
  ];

  return (
    <section className={styles.live}>
      <header>
        <h1>{cook.name}</h1>
        <strong>{formatDuration(now - started)}</strong>
        <p>
          {cook.targetPitTempF ? `Target pit ${cook.targetPitTempF}°F · ` : ''}
          <Link to={`/cooks/${cook.id}/edit`}>Edit setup</Link>
        </p>
      </header>
      <ul className={styles.glance}>
        {glance.map(({ label, event, value }) => (
          <li key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{event ? timeAgo(event.at, now) : ''}</small>
          </li>
        ))}
      </ul>
      <div
        className={styles.events}
        role="group"
        aria-label="Log an event"
      >
        {eventTypeDefs.map((def) => (
          <button
            key={def.key}
            type="button"
            onClick={() => tap(def.key)}
          >
            {def.label}
          </button>
        ))}
      </div>
      {cook.events.length > 0 && (
        <>
          <h2>Timeline</h2>
          <Timeline
            events={cook.events}
            startedAt={cook.startedAt}
            onSelect={(event) => setTarget({ mode: 'edit', event })}
          />
        </>
      )}
      <div className={styles.finish}>
        <Button
          size="large"
          variant="secondary"
          onClick={() => navigate(`/cooks/${cook.id}/wrap-up`, { replace: true })}
        >
          Finish cook
        </Button>
      </div>
      <SyncStatus quiet />
      <EventSheet
        cook={cook}
        target={target}
        onClose={() => setTarget(null)}
        onLogged={announce}
        onDelete={(event) => {
          setTarget(null);
          setDeleting(event);
        }}
      />
      <ConfirmSheet
        open={deleting !== null}
        title="Delete this entry?"
        message="It will be removed from the timeline."
        confirmLabel="Delete"
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) deleteEvent(cook.id, deleting.id);
          setDeleting(null);
        }}
      />
      <UndoToast
        toast={toast}
        onUndo={undo}
        onClose={() => setToast(null)}
      />
    </section>
  );
};

export default LiveCook;
