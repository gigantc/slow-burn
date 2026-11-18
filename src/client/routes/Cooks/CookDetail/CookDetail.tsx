import { useState } from 'react';
import { useNavigate } from 'react-router';
import { RATING_MAX } from 'shared/constants';
import type { CookWithEvents } from 'shared/types';
import Button from '@/components/Button/Button';
import Callout from '@/components/Callout/Callout';
import ConfirmSheet from '@/components/ConfirmSheet/ConfirmSheet';
import EntryHead from '@/components/EntryHead/EntryHead';
import { cookTags } from '@/components/CookList/cookCard';
import { deleteCook } from '@/lib/cookActions';
import { formatDay, formatDuration } from '@/lib/format';
import Timeline from '../Timeline/Timeline';
import styles from './CookDetail.module.scss';

const CookDetail = ({ cook }: { cook: CookWithEvents }) => {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);

  const total =
    cook.startedAt && cook.endedAt
      ? formatDuration(new Date(cook.endedAt).getTime() - new Date(cook.startedAt).getTime())
      : null;

  const stats = [
    ['Protein', cook.protein],
    ['Cut', cook.cut],
    ['Weight', cook.weightLbs === null ? null : `${cook.weightLbs} lb`],
    ['Smoker', cook.smoker],
    ['Wood', cook.wood],
    ['Target pit', cook.targetPitTempF === null ? null : `${cook.targetPitTempF}°F`],
    ['Final internal', cook.finalInternalTempF === null ? null : `${cook.finalInternalTempF}°F`],
  ].flatMap(([label, value]) => (value ? [[label, value] as const] : []));

  return (
    <section className={styles.detail}>
      <EntryHead
        type="cook"
        tags={cookTags(cook)}
      >
        <h1>{cook.name}</h1>
      </EntryHead>
      <p className={styles.meta}>
        <time dateTime={cook.startedAt ?? cook.createdAt}>
          {formatDay(cook.startedAt ?? cook.createdAt)}
        </time>
        {total && <span>{total} total</span>}
        {cook.rating !== null && (
          <span
            role="img"
            aria-label={`${cook.rating} out of ${RATING_MAX} stars`}
          >
            {'★'.repeat(cook.rating)}
            {'☆'.repeat(RATING_MAX - cook.rating)}
          </span>
        )}
      </p>
      {cook.nextTimeNote && <Callout title="Next time">{cook.nextTimeNote}</Callout>}
      {stats.length > 0 && (
        <dl className={styles.stats}>
          {stats.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {cook.prep && (
        <>
          <h2>Prep</h2>
          <p className={styles.notes}>{cook.prep}</p>
        </>
      )}
      {cook.notes && (
        <>
          <h2>Notes</h2>
          <p className={styles.notes}>{cook.notes}</p>
        </>
      )}
      <h2>Timeline</h2>
      {cook.events.length > 0 ? (
        <Timeline
          events={cook.events}
          startedAt={cook.startedAt}
        />
      ) : (
        <p>No events were logged.</p>
      )}
      <div className={styles.actions}>
        <Button
          variant="secondary"
          onClick={() => navigate(`/cooks/${cook.id}/edit`)}
        >
          Edit setup
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate(`/cooks/${cook.id}/wrap-up`)}
        >
          Edit wrap-up
        </Button>
        <Button
          variant="danger"
          onClick={() => setConfirming(true)}
        >
          Delete cook
        </Button>
      </div>
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
    </section>
  );
};

export default CookDetail;
