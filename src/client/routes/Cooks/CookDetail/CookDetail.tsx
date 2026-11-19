import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { CookWithEvents } from 'shared/types';
import Button from '@/components/Button/Button';
import ConfirmSheet from '@/components/ConfirmSheet/ConfirmSheet';
import DetailHeader from '@/components/DetailHeader/DetailHeader';
import PhotoMosaic from '@/components/PhotoMosaic/PhotoMosaic';
import PhotoSheet from '@/components/PhotoSheet/PhotoSheet';
import NextTime from '@/components/NextTime/NextTime';
import StatTile, { StatTiles } from '@/components/StatTile/StatTile';
import TempChart, { hasTrend } from '@/components/TempChart/TempChart';
import UndoToast from '@/components/UndoToast/UndoToast';
import { deleteCook, saveCook } from '@/lib/cookActions';
import { readings, wrapSpans } from '@/lib/cookEvents';
import { useMeatName } from '@/lib/cookHooks';
import { cookDate, cookDetails, cookTargets } from '@/lib/cookInfo';
import { formatDuration, formatMonthDay } from '@/lib/format';
import { averagePit, restedMs } from '@/lib/liveStats';
import { useStoredPhotos } from '@/lib/photoHooks';
import { useRating } from '@/lib/useRating';
import { TimelineCard } from '../Timeline/Timeline';
import styles from './CookDetail.module.scss';

const toPoints = (cook: CookWithEvents, type: 'pit_temp' | 'internal_temp') =>
  readings(cook.events, type).map((event) => ({
    at: new Date(event.at).getTime(),
    value: event.value ?? 0,
  }));

const CookDetail = ({ cook }: { cook: CookWithEvents }) => {
  const meatName = useMeatName(cook.meatId);
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const photos = useStoredPhotos('cook', cook.id);
  const [openPhoto, setOpenPhoto] = useState<string | null>(null);

  const date = formatMonthDay(cookDate(cook));
  const meta = [...cookDetails(cook), cookTargets(cook)].flatMap((part) => (part ? [part] : []));

  // Only the stats we can derive
  const total =
    cook.startedAt && cook.endedAt
      ? new Date(cook.endedAt).getTime() - new Date(cook.startedAt).getTime()
      : null;
  const average = averagePit(cook.events);
  const rested = cook.endedAt ? restedMs(cook.events, cook.endedAt) : null;
  const stats = [
    total === null ? null : (['Total time', formatDuration(total)] as const),
    cook.finalInternalTempF === null
      ? null
      : (['Final temp', `${cook.finalInternalTempF}°`] as const),
    average === null ? null : (['Avg pit', `${average}°`] as const),
    rested === null ? null : (['Rested', formatDuration(rested)] as const),
  ].flatMap((stat) => (stat ? [stat] : []));

  const pit = toPoints(cook, 'pit_temp');
  const meat = toPoints(cook, 'internal_temp');
  const charted = cook.startedAt && cook.endedAt && hasTrend(pit, meat);

  // Rating happens after the meal, so it saves straight from here (with an Undo).
  const { toast, rate, undo, close } = useRating(cook.rating, (rating) =>
    saveCook({ id: cook.id, rating }),
  );

  return (
    <div className={styles.detail}>
      <DetailHeader
        crumb={{ to: '/cooks', label: 'Cooks', current: date }}
        editTo={`/cooks/${cook.id}/edit`}
        editLabel="Edit cook"
        eyebrow={`Cook · ${date}`}
        category="cook"
        title={meatName}
        rating={cook.rating}
        onRate={rate}
        meta={meta.length > 0 ? meta.join(' · ') : undefined}
        overHero={photos.photos.length > 0}
      />
      <div className={styles.main}>
        {photos.photos.length > 0 && (
          <PhotoMosaic
            className={styles.photos}
            photos={photos.photos}
            name={meatName}
            onOpen={setOpenPhoto}
          />
        )}
        {charted && cook.startedAt && cook.endedAt && (
          <TempChart
            className={styles.chart}
            title="Temps"
            pit={pit}
            meat={meat}
            start={new Date(cook.startedAt).getTime()}
            end={new Date(cook.endedAt).getTime()}
            targetMeat={cook.targetInternalTempF}
            wraps={wrapSpans(cook.events)}
          />
        )}
        {cook.prep && (
          <section className={styles.notes}>
            <h2>Prep</h2>
            <p>{cook.prep}</p>
          </section>
        )}
        {cook.notes && (
          <section className={styles.notes}>
            <h2>Notes</h2>
            <p>{cook.notes}</p>
          </section>
        )}
        <div className={styles.actions}>
          <Button
            variant="secondary"
            onClick={() => navigate(`/cooks/${cook.id}/wrap-up`)}
          >
            Edit wrap-up
          </Button>
          <Button
            variant="dangerText"
            onClick={() => setConfirming(true)}
          >
            Delete cook
          </Button>
        </div>
      </div>
      <div className={styles.aside}>
        {stats.length > 0 && (
          <StatTiles className={styles.stats}>
            {stats.map(([label, value]) => (
              <StatTile
                key={label}
                label={label}
                value={value}
              />
            ))}
          </StatTiles>
        )}
        {cook.nextTimeNote && <NextTime className={styles.next}>{cook.nextTimeNote}</NextTime>}
        <TimelineCard
          className={styles.log}
          events={cook.events}
        />
      </div>
      <PhotoSheet
        ops={photos}
        name={meatName}
        openId={openPhoto}
        onOpen={setOpenPhoto}
      />
      <UndoToast
        toast={toast}
        onUndo={undo}
        onClose={close}
      />
      <ConfirmSheet
        open={confirming}
        title="Delete this cook?"
        message="The cook and its timeline will be removed. This can't be undone."
        confirmLabel="Delete cook"
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          deleteCook(cook.id);
          navigate('/cooks', { replace: true });
        }}
      />
    </div>
  );
};

export default CookDetail;
