import { useEffect, useState } from 'react';
import Button from '@/components/Button/Button';
import ConfirmSheet from '@/components/ConfirmSheet/ConfirmSheet';
import Field from '@/components/Field/Field';
import PhotoImage from '@/components/PhotoImage/PhotoImage';
import Sheet from '@/components/Sheet/Sheet';
import type { PhotoOps } from '@/lib/photoHooks';
import styles from './PhotoSheet.module.scss';

type Props = {
  ops: PhotoOps;
  /** What the photos are of: "Lagavulin 16". */
  name: string;
  /** The photo being viewed, or null for closed. */
  openId: string | null;
  onOpen: (id: string | null) => void;
};

/**
 * A photo large, with its caption (saved when you leave the field), Make featured and Delete. With
 * more than one photo, a strip of thumbnails switches between them.
 */
const PhotoSheet = ({ ops, name, openId, onOpen }: Props) => {
  const photo = ops.photos.find((p) => p.id === openId);
  const [caption, setCaption] = useState('');
  const [deleting, setDeleting] = useState(false);

  // The field starts from the photo's caption whenever another photo is shown
  useEffect(() => setCaption(photo?.caption ?? ''), [photo?.id, photo?.caption]);

  const save = () => {
    if (photo && caption.trim() !== (photo.caption ?? '')) ops.setCaption(photo.id, caption);
  };
  const open = (id: string | null) => {
    save();
    onOpen(id);
  };

  return (
    <>
      <Sheet
        open={Boolean(photo)}
        onClose={() => open(null)}
        label="Photo"
      >
        {photo && (
          <>
            <PhotoImage
              className={styles.large}
              photo={photo}
              size="display"
              alt={photo.caption ?? `${name} photo`}
            />
            {ops.photos.length > 1 && (
              <ul className={styles.strip}>
                {ops.photos.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      aria-label={`Show photo: ${p.caption ?? `${name} photo`}`}
                      aria-current={p.id === photo.id}
                      onClick={() => open(p.id)}
                    >
                      <PhotoImage
                        photo={p}
                        alt=""
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Field
              label="Caption"
              value={caption}
              maxLength={500}
              onChange={(e) => setCaption(e.target.value)}
              onBlur={save}
            />
            {!photo.featured && (
              <Button
                variant="secondary"
                onClick={() => ops.makeFeatured(photo.id)}
              >
                Make featured
              </Button>
            )}
            <Button
              variant="dangerText"
              onClick={() => setDeleting(true)}
            >
              Delete photo
            </Button>
            <Button
              variant="secondary"
              onClick={() => open(null)}
            >
              Done
            </Button>
          </>
        )}
      </Sheet>
      <ConfirmSheet
        open={deleting}
        title="Delete this photo?"
        message="It will be removed for good."
        confirmLabel="Delete photo"
        onClose={() => setDeleting(false)}
        onConfirm={() => {
          if (photo) ops.remove(photo.id);
          setDeleting(false);
          onOpen(null);
        }}
      />
    </>
  );
};

export default PhotoSheet;
