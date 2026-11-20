import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { getTastingCategory } from 'shared/tastingCategories';
import Button from '@/components/Button/Button';
import ConfirmSheet from '@/components/ConfirmSheet/ConfirmSheet';
import DetailHeader from '@/components/DetailHeader/DetailHeader';
import PhotoGrid from '@/components/PhotoGrid/PhotoGrid';
import PhotoMosaic from '@/components/PhotoMosaic/PhotoMosaic';
import PhotoPicker from '@/components/PhotoPicker/PhotoPicker';
import PhotoSheet from '@/components/PhotoSheet/PhotoSheet';
import StatTile, { StatTiles } from '@/components/StatTile/StatTile';
import UndoToast from '@/components/UndoToast/UndoToast';
import { formatMonthDay } from '@/lib/format';
import { useStoredPhotos } from '@/lib/photoHooks';
import { deleteTasting, saveTasting } from '@/lib/tastingActions';
import { useTasting, useTastings } from '@/lib/tastingHooks';
import { formatDetail, tastingDate } from '@/lib/tastingInfo';
import { useCategoryAccent } from '@/lib/useCategoryAccent';
import { useRating } from '@/lib/useRating';
import TastingMissing from '../TastingMissing/TastingMissing';
import styles from './TastingDetail.module.scss';

/** /tastings/:id. Fields with no value simply don't render. */
const TastingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const tasting = useTasting(id);
  const { ready } = useTastings();
  const [confirming, setConfirming] = useState(false);
  const photos = useStoredPhotos('tasting', id ?? '');
  const [openPhoto, setOpenPhoto] = useState<string | null>(null);
  const { toast, rate, undo, close } = useRating(tasting?.rating ?? null, (rating) =>
    saveTasting({ id, rating }),
  );
  useCategoryAccent(tasting?.category);

  if (!tasting) return ready ? <TastingMissing /> : null;

  const category = getTastingCategory(tasting.category);
  const date = formatMonthDay(tastingDate(tasting));
  const stats = category.specFields.flatMap((field) => {
    const value = tasting.details[field.key];
    return value === undefined ? [] : [{ label: field.label, value: formatDetail(field, value) }];
  });
  const notes = category.noteFields.flatMap((field) => {
    const value = tasting.details[field.key];
    return value === undefined ? [] : [{ label: field.label, value: String(value) }];
  });

  const hasPhotos = photos.photos.length > 0;

  return (
    <div className={hasPhotos ? `${styles.detail} ${styles.withHero}` : styles.detail}>
      <DetailHeader
        crumb={{ to: `/tastings?category=${tasting.category}`, label: 'Tastings', current: date }}
        editTo={`/tastings/${tasting.id}/edit`}
        editLabel="Edit tasting"
        eyebrow={`${category.label} · ${date}`}
        category={tasting.category}
        title={tasting.name}
        rating={tasting.rating}
        onRate={rate}
        meta={tasting.maker ?? undefined}
        overHero={hasPhotos}
      />
      {hasPhotos && (
        <PhotoMosaic
          className={styles.hero}
          photos={photos.photos}
          name={tasting.name}
          onOpen={setOpenPhoto}
          single
        />
      )}
      <div className={styles.main}>
        {notes.length > 0 && (
          <dl className={styles.notes}>
            {notes.map((note) => (
              <div key={note.label}>
                <dt>{note.label}</dt>
                <dd>{note.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {tasting.notes && (
          <section className={styles.text}>
            <h2>Notes</h2>
            <p>{tasting.notes}</p>
          </section>
        )}
        {hasPhotos ? (
          <PhotoGrid
            photos={photos.photos}
            name={tasting.name}
            onOpen={setOpenPhoto}
            add={
              <PhotoPicker
                label="Add photos"
                onPick={photos.add}
              />
            }
          />
        ) : (
          <PhotoPicker
            variant="button"
            label="Add photos"
            onPick={photos.add}
          >
            Add photos
          </PhotoPicker>
        )}
        <Button
          className={styles.delete}
          variant="dangerText"
          onClick={() => setConfirming(true)}
        >
          Delete tasting
        </Button>
      </div>
      {stats.length > 0 && (
        <StatTiles className={styles.stats}>
          {stats.map((stat) => (
            <StatTile
              key={stat.label}
              label={stat.label}
              value={stat.value}
            />
          ))}
        </StatTiles>
      )}
      <PhotoSheet
        ops={photos}
        name={tasting.name}
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
        title="Delete this tasting?"
        message="The tasting will be removed. This can't be undone."
        confirmLabel="Delete tasting"
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          deleteTasting(tasting.id);
          navigate(`/tastings?category=${tasting.category}`, { replace: true });
        }}
      />
    </div>
  );
};

export default TastingDetail;
