import type { ReactNode } from 'react';
import Icon from '@/components/Icon/Icon';
import PhotoImage from '@/components/PhotoImage/PhotoImage';
import type { PhotoItem } from '@/lib/photoHooks';
import { useStoreState } from '@/lib/storeHooks';
import styles from './PhotoGrid.module.scss';

type Props = {
  photos: readonly PhotoItem[];
  /** What the photos are of, for their alt text when they have no caption: "Lagavulin 16". */
  name: string;
  onOpen: (id: string) => void;
  /** The add tile (a PhotoPicker), last in the grid. */
  add?: ReactNode;
  className?: string;
};

/** Square thumbnails in order. The featured one is badged and one still uploading is marked. */
const PhotoGrid = ({ photos, name, onOpen, add, className }: Props) => {
  const { pendingBlobs } = useStoreState();

  return (
    <ul className={className ? `${styles.grid} ${className}` : styles.grid}>
      {photos.map((photo) => {
        const alt = photo.caption ?? `${name} photo`;
        return (
          <li key={photo.id}>
            <button
              type="button"
              aria-label={`Open photo: ${alt}`}
              onClick={() => onOpen(photo.id)}
            >
              <PhotoImage
                photo={photo}
                alt={alt}
              />
              {photo.featured && <span className={styles.badge}>Featured</span>}
              {pendingBlobs.has(photo.id) && (
                <span
                  className={styles.pending}
                  role="img"
                  aria-label="Waiting to upload"
                >
                  <Icon name="upload" />
                </span>
              )}
            </button>
          </li>
        );
      })}
      {add && <li>{add}</li>}
    </ul>
  );
};

export default PhotoGrid;
