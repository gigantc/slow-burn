import type { CSSProperties } from 'react';
import { usePhotoSrc } from '@/lib/photoHooks';
import type { PhotoItem } from '@/lib/photoHooks';
import type { PhotoSize } from '@/lib/photoInfo';

type Props = {
  photo: PhotoItem;
  size?: PhotoSize;
  /** The caption, or "{name} photo"; empty for a decorative thumbnail inside a labelled link. */
  alt: string;
  className?: string;
};

// The focal point as a custom property; a cropped view (object-fit:cover) reads it in its own
// SCSS as `object-position:var(--focus, ...)`, a contained one ignores it.
const focusOf = (photo: PhotoItem) =>
  ({ '--focus': `${photo.focusX ?? 50}% ${photo.focusY ?? 50}%` }) as CSSProperties;

/** A photo from its local file while it waits to upload, from the server after. */
const PhotoImage = ({ photo, size = 'thumb', alt, className }: Props) => (
  <img
    className={className}
    style={focusOf(photo)}
    src={usePhotoSrc(photo, size)}
    alt={alt}
    width={photo.width}
    height={photo.height}
    decoding="async"
  />
);

export default PhotoImage;
