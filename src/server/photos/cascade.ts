//////////////////////////////////////
// Photos of a deleted cook or tasting
// An owner and its photo rows go in one transaction; the files go after it commits.

import { and, eq } from 'drizzle-orm';
import type { PhotoOwnerType } from '../../shared/types.js';
import { db } from '../db/index.js';
import { photos } from '../db/schema.js';
import { photoStorage } from './storage.js';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Delete an owner's photo rows inside `tx` and return their ids (pass them to removePhotoFiles). */
export const detachPhotos = (tx: Tx, ownerType: PhotoOwnerType, ownerId: string): string[] => {
  const owner = and(eq(photos.ownerType, ownerType), eq(photos.ownerId, ownerId));
  const ids = tx
    .select({ id: photos.id })
    .from(photos)
    .where(owner)
    .all()
    .map((row) => row.id);
  tx.delete(photos).where(owner).run();
  return ids;
};

/** Delete the files of photos whose rows are already gone. A failure is logged, not thrown. */
export const removePhotoFiles = async (ids: readonly string[]): Promise<void> => {
  const results = await Promise.allSettled(ids.map((id) => photoStorage.remove(id)));
  results.forEach((result, i) => {
    if (result.status === 'rejected')
      console.error('Could not remove photo files', ids[i], result.reason);
  });
};
