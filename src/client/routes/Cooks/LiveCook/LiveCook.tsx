import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import type { CookEventTypeKey } from 'shared/cookEventTypes';
import type { CookEvent, CookWithEvents } from 'shared/types';
import Button from '@/components/Button/Button';
import ConfirmSheet from '@/components/ConfirmSheet/ConfirmSheet';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import SyncStatus from '@/components/SyncStatus/SyncStatus';
import UndoToast from '@/components/UndoToast/UndoToast';
import type { Toast } from '@/components/UndoToast/UndoToast';
import { addEvent, deleteEvent } from '@/lib/cookActions';
import { eventDef, eventTypeDefs } from '@/lib/cookEvents';
import { useMeatName } from '@/lib/cookHooks';
import { clockTime, formatDayShort, formatDuration } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { useWakeLock } from '@/lib/useWakeLock';
import EventSheet from '../EventSheet/EventSheet';
import type { EventTarget } from '../EventSheet/EventSheet';
import Timeline from '../Timeline/Timeline';
import styles from './LiveCook.module.scss';

const LiveCook = ({ cook }: { cook: CookWithEvents }) => {
  useWakeLock();
  const meatName = useMeatName(cook.meatId);
  const now = useNow(30_000);
  const navigate = useNavigate();
  const [target, setTarget] = useState<EventTarget | null>(null);
  const [deleting, setDeleting] = useState<CookEvent | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

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

  const targets = [
    cook.targetInternalTempF ? `Target meat ${cook.targetInternalTempF}°F` : '',
    cook.targetPitTempF ? `Target pit ${cook.targetPitTempF}°F` : '',
  ].filter(Boolean);

  return (
    <section className={styles.live}>
      <Breadcrumb
        to="/cooks"
        label="Cooks"
      />
      <header>
        <h1>{meatName}</h1>
        {cook.startedAt && (
          <p>{`${formatDayShort(cook.startedAt)} · ${clockTime(cook.startedAt)}`}</p>
        )}
        <strong>{formatDuration(now - started)}</strong>
        <p>
          {targets.map((target) => `${target} · `)}
          <Link to={`/cooks/${cook.id}/edit`}>Edit setup</Link>
        </p>
      </header>
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
