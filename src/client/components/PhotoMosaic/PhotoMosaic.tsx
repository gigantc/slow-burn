import PhotoImage from '@/components/PhotoImage/PhotoImage';
import type { PhotoItem } from '@/lib/photoHooks';
import styles from './PhotoMosaic.module.scss';

type Props = {
  /** In order; the featured one is shown large. */
  photos: readonly PhotoItem[];
  /** What the photos are of, for alt text without a caption. */
  name: string;
  onOpen: (id: string) => void;
  /** Just the featured photo, no small ones (the screen lists the rest itself). */
  single?: boolean;
  className?: string;
};

const SMALL = 2;

/**
 * The top of a detail screen. Phone: the featured photo edge to edge (a pill says how many
 * more). Desktop: the featured photo large with up to two small ones beside it, "+N" on the last
 * when there are more. A tap opens the photo sheet.
 */
const PhotoMosaic = ({ photos, name, onOpen, single = false, className }: Props) => {
  const featured = photos.find((photo) => photo.featured) ?? photos[0];
  if (!featured) return null;

  const others = photos.filter((photo) => photo !== featured);
  const small = single ? [] : others.slice(0, SMALL);
  const more = single ? 0 : others.length - small.length;
  const label = (photo: PhotoItem) => photo.caption ?? `${name} photo`;

  return (
    <div
      className={className ? `${styles.mosaic} ${className}` : styles.mosaic}
      data-small={small.length}
    >
      <button
        className={styles.main}
        type="button"
        aria-label={`Open photos: ${label(featured)}`}
        onClick={() => onOpen(featured.id)}
      >
        <PhotoImage
          photo={featured}
          size="display"
          alt={label(featured)}
        />
        {photos.length > 1 && <span className={styles.count}>{`${photos.length} photos`}</span>}
      </button>
      {small.map((photo, i) => (
        <button
          key={photo.id}
          className={styles.small}
          type="button"
          aria-label={`Open photo: ${label(photo)}`}
          onClick={() => onOpen(photo.id)}
        >
          <PhotoImage
            photo={photo}
            alt={label(photo)}
          />
          {more > 0 && i === small.length - 1 && <span className={styles.more}>{`+${more}`}</span>}
        </button>
      ))}
    </div>
  );
};

export default PhotoMosaic;
