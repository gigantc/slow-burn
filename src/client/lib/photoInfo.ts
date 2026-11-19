//////////////////////////////////////
// Photo facts: where the image files are, and their order

import type { Photo } from 'shared/types';
import { API_BASE } from '@/config';

export type PhotoSize = 'thumb' | 'display';

/** The URL of a photo's image file (the server sends it with a year-long cache header). */
export const photoUrl = (id: string, size: PhotoSize = 'display') =>
  `${API_BASE}/photos/${id}?size=${size}`;

/** The owner's own order: by `sort`, then oldest first. */
export const comparePhotos = (
  a: Pick<Photo, 'sort' | 'createdAt'>,
  b: Pick<Photo, 'sort' | 'createdAt'>,
) => a.sort - b.sort || a.createdAt.localeCompare(b.createdAt);
