import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import type { CookEventTypeKey } from 'shared/cookEventTypes';
import type { CookEvent, CookWithEvents } from 'shared/types';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import Button from '@/components/Button/Button';
import ConfirmSheet from '@/components/ConfirmSheet/ConfirmSheet';
import Icon from '@/components/Icon/Icon';
import NextTime from '@/components/NextTime/NextTime';
import Sheet from '@/components/Sheet/Sheet';
import SyncStatus from '@/components/SyncStatus/SyncStatus';
import TempChart from '@/components/TempChart/TempChart';
import TempTile from '@/components/TempTile/TempTile';
import UndoToast from '@/components/UndoToast/UndoToast';
import type { Toast } from '@/components/UndoToast/UndoToast';
import { addEvent, deleteEvent, markOffPit } from '@/lib/cookActions';
import { eventDef, latestEvent, readings } from '@/lib/cookEvents';
import { useMeatName } from '@/lib/cookHooks';
import { clockTime, formatClock } from '@/lib/format';
import { meatProgress, pitProgress } from '@/lib/liveStats';
import { useNextTimeNote } from '@/lib/nextTime';
import { useSky } from '@/lib/sky';
import { useNow } from '@/lib/useNow';
import { useWakeLock } from '@/lib/useWakeLock';
import EventGrid from '../EventGrid/EventGrid';
import EventSheet from '../EventSheet/EventSheet';
import type { EventTarget } from '../EventSheet/EventSheet';
import Timeline from '../Timeline/Timeline';
import styles from './LiveCook.module.scss';

const LiveCook = ({ cook }: { cook: CookWithEvents }) => {
  useWakeLock();
  useSky();
  const meatName = useMeatName(cook.meatId);
  const nextTime = useNextTimeNote(cook.meatId, cook.id);
  const now = useNow(30_000);
  const navigate = useNavigate();
  const [target, setTarget] = useState<EventTarget | null>(null);
  const [deleting, setDeleting] = useState<CookEvent | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const started = cook.startedAt ? new Date(cook.startedAt).getTime() : now;

  const announce = (event: CookEvent) =>
    setToast({ id: event.id, message: `${eventDef(event.type).label} logged` });

  const tap = (type: CookEventTypeKey) => {
    const def = eventDef(type);
    if (def.value || def.takesNote) setTarget({ mode: 'log', type });
    else announce(addEvent(cook.id, { type }));
  };

  // The terminal action: note that the meat is off, then wrap up.
  const off = () => {
    markOffPit(cook.id);
    navigate(`/cooks/${cook.id}/wrap-up`, { replace: true });
  };

  const undo = () => {
    if (toast) deleteEvent(cook.id, toast.id);
    setToast(null);
  };

  const pit = readings(cook.events, 'pit_temp').map((e) => ({
    at: new Date(e.at).getTime(),
    value: e.value ?? 0,
  }));
  const meat = readings(cook.events, 'internal_temp').map((e) => ({
    at: new Date(e.at).getTime(),
    value: e.value ?? 0,
  }));
  const wrap = latestEvent(cook.events, 'wrap');
  const pitNow = latestEvent(cook.events, 'pit_temp')?.value ?? null;
  const meatNow = latestEvent(cook.events, 'internal_temp')?.value ?? null;
  const targets = [
    cook.targetInternalTempF ? `${cook.targetInternalTempF}° meat` : '',
    cook.targetPitTempF ? `${cook.targetPitTempF}° pit` : '',
  ].filter(Boolean);
  const details = [cook.weightLbs === null ? '' : `${cook.weightLbs} lb`, cook.wood ?? ''].filter(
    Boolean,
  );

  return (
    <div className={styles.live}>
      <header>
        <Link
          className={styles.back}
          to="/"
          aria-label="Back to home"
        >
          <Icon name="chevronLeft" />
        </Link>
        <Breadcrumb
          to="/cooks"
          label="Cooks"
          current="Live"
        />
        <span className={styles.pill}>On the pit</span>
        <button
          className={styles.menu}
          type="button"
          aria-label="Cook actions"
          aria-haspopup="dialog"
          onClick={() => setMenuOpen(true)}
        >
          <Icon name="dots" />
        </button>
        <h1>{meatName}</h1>
        <small className={styles.meta}>
          {details.join(' · ')}
          {targets.length > 0 && (
            <span>{`${details.length > 0 ? ' · ' : ''}Target ${targets.join(', ')}`}</span>
          )}
        </small>
      </header>
      <div className={styles.main}>
        <div className={styles.stats}>
          <p>
            <small className={styles.label}>Elapsed</small>
            <data>{formatClock(now - started)}</data>
            <small className={styles.since}>
              {cook.startedAt ? `hours on, since ${clockTime(started)}` : 'hours on'}
            </small>
          </p>
          <TempTile
            label="Pit"
            series="pit"
            value={pitNow}
            target={cook.targetPitTempF}
            progress={pitProgress(pitNow, cook.targetPitTempF)}
          />
          <TempTile
            label="Meat"
            series="meat"
            value={meatNow}
            target={cook.targetInternalTempF}
            progress={meatProgress(cook.events, cook.targetInternalTempF)}
          />
        </div>
        {pit.length + meat.length >= 2 && (
          <div className={styles.chart}>
            <TempChart
              pit={pit}
              meat={meat}
              start={started}
              end={Math.max(now, ...pit.map((r) => r.at), ...meat.map((r) => r.at))}
              targetMeat={cook.targetInternalTempF}
              wrapAt={wrap ? new Date(wrap.at).getTime() : null}
            />
          </div>
        )}
        {nextTime && <NextTime variant="strip">{nextTime.nextTimeNote}</NextTime>}
        <EventGrid
          onTap={tap}
          onOff={off}
        />
      </div>
      {cook.events.length > 0 && (
        <section className={styles.log}>
          <h2>Timeline</h2>
          <Timeline
            events={cook.events}
            onSelect={(event) => setTarget({ mode: 'edit', event })}
          />
        </section>
      )}
      <SyncStatus quiet />
      <Sheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        label="Cook actions"
      >
        <Button
          to={`/cooks/${cook.id}/edit`}
          variant="secondary"
          size="lg"
        >
          Edit setup
        </Button>
      </Sheet>
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
    </div>
  );
};

export default LiveCook;
