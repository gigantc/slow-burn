//////////////////////////////////////
// Photo actions
// Local-first, like every other action: a picked photo is resized, kept in IndexedDB and shown
// at once, and the outbox uploads it when there is a connection. Edits (caption, featured) and
// deletes queue behind the upload, so the server sees them in order. A photo deleted before its
// upload went out is simply cancelled.

import type { Photo, PhotoOwnerType } from 'shared/types';
import { dbGetAll } from '@/lib/idb';
import { PhotoReadError, resizeImage, UNREADABLE_PHOTO } from '@/lib/imageResize';
import type { ResizedImage } from '@/lib/imageResize';
import { getStoreState, mutate, setNotice } from '@/lib/store';
import { requestSync } from '@/lib/sync';
import type { OutboxOp } from '@/lib/types';

/** A photo not in the store yet: a new tasting's, waiting for the tasting to be saved. */
export type DraftPhoto = Photo & { blob: Blob };

const commit = (...args: Parameters<typeof mutate>) => {
  void mutate(...args).then(requestSync);
};

const photoPath = (id: string) => `/photos/${id}`;

const uploadOp = (photo: Photo) => ({
  method: 'POST' as const,
  path: photoPath(photo.id),
  body: { ownerType: photo.ownerType, ownerId: photo.ownerId, caption: photo.caption },
});

const ownersPhotos = (ownerType: PhotoOwnerType, ownerId: string) =>
  getStoreState().photos.filter((p) => p.ownerType === ownerType && p.ownerId === ownerId);

//////////////////////////////////////
// Reading files

/** Resize each file. Ones this browser can't decode are skipped, and the person is told once. */
export const prepareFiles = async (files: readonly File[]): Promise<ResizedImage[]> => {
  const ready: ResizedImage[] = [];
  let unreadable = 0;
  for (const file of files) {
    try {
      ready.push(await resizeImage(file));
    } catch (err) {
      if (!(err instanceof PhotoReadError)) throw err;
      unreadable += 1;
    }
  }
  if (unreadable > 0) setNotice(UNREADABLE_PHOTO);
  return ready;
};

/** A photo record for a new image. The first photo of an owner is its featured one. */
const makePhoto = (
  ownerType: PhotoOwnerType,
  ownerId: string,
  image: ResizedImage,
  existing: readonly Pick<Photo, 'sort'>[],
): Photo => {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    ownerType,
    ownerId,
    featured: existing.length === 0,
    sort: existing.reduce((top, p) => Math.max(top, p.sort), -1) + 1,
    caption: null,
    width: image.width,
    height: image.height,
    createdAt: now,
    updatedAt: now,
  };
};

//////////////////////////////////////
// Adding

/** Add photos to a cook or tasting that exists. Resolves to how many could be read and were added. */
export const addPhotos = async (
  ownerType: PhotoOwnerType,
  ownerId: string,
  files: readonly File[],
): Promise<number> => {
  const images = await prepareFiles(files);
  for (const image of images) {
    const photo = makePhoto(ownerType, ownerId, image, ownersPhotos(ownerType, ownerId));
    commit({
      photoUpserts: [photo],
      blobUpserts: [{ id: photo.id, blob: image.blob }],
      ops: [uploadOp(photo)],
    });
  }
  return images.length;
};

/** Photos picked on a new tasting's form, not saved anywhere yet. */
export const makeDrafts = async (
  ownerType: PhotoOwnerType,
  ownerId: string,
  existing: readonly DraftPhoto[],
  files: readonly File[],
): Promise<DraftPhoto[]> => {
  const drafts = [...existing];
  for (const image of await prepareFiles(files)) {
    drafts.push({ ...makePhoto(ownerType, ownerId, image, drafts), blob: image.blob });
  }
  return drafts.slice(existing.length);
};

/** Queue the drafts once their tasting is saved (call it after the tasting's own save). */
export const commitDrafts = (drafts: readonly DraftPhoto[]) => {
  if (drafts.length === 0) return;
  const ordered = [...drafts].sort((a, b) => a.sort - b.sort);
  const photos = ordered.map(({ blob: _blob, ...photo }) => photo);
  const wanted = photos.find((photo) => photo.featured);
  const now = new Date().toISOString();
  commit({
    photoUpserts: photos,
    blobUpserts: ordered.map((draft) => ({ id: draft.id, blob: draft.blob })),
    ops: [
      ...photos.map(uploadOp),
      // The server features the first one uploaded; if the person picked another, say so
      ...(wanted && wanted.id !== photos[0]?.id
        ? [
            {
              method: 'PATCH' as const,
              path: photoPath(wanted.id),
              body: { featured: true, updatedAt: now },
            },
          ]
        : []),
    ],
  });
};

//////////////////////////////////////
// Editing

const find = (id: string) => getStoreState().photos.find((photo) => photo.id === id);

export const setCaption = (id: string, text: string) => {
  const photo = find(id);
  const caption = text.trim() || null;
  if (!photo || caption === photo.caption) return;

  const updatedAt = new Date().toISOString();
  commit({
    photoUpserts: [{ ...photo, caption, updatedAt }],
    ops: [{ method: 'PATCH', path: photoPath(id), body: { caption, updatedAt } }],
  });
};

export const makeFeatured = (id: string) => {
  const photo = find(id);
  if (!photo || photo.featured) return;

  const updatedAt = new Date().toISOString();
  const upserts = ownersPhotos(photo.ownerType, photo.ownerId).flatMap((p) =>
    p.id === id
      ? [{ ...p, featured: true, updatedAt }]
      : p.featured
        ? [{ ...p, featured: false, updatedAt }]
        : [],
  );
  commit({
    photoUpserts: upserts,
    ops: [{ method: 'PATCH', path: photoPath(id), body: { featured: true, updatedAt } }],
  });
};

/** Delete a photo; if it was featured, the next one takes over (as the server does too). */
export const deletePhoto = async (id: string) => {
  const photo = find(id);
  if (!photo) return;

  const updatedAt = new Date().toISOString();
  const next = photo.featured
    ? ownersPhotos(photo.ownerType, photo.ownerId).find((p) => p.id !== id)
    : undefined;
  const promoted = next ? [{ ...next, featured: true, updatedAt }] : [];

  if (getStoreState().pendingBlobs.has(id)) {
    // Not uploaded yet: cancel it and anything queued behind it; the server never hears of it
    const queued = (await dbGetAll<OutboxOp>('outbox')).filter((op) => op.path === photoPath(id));
    commit({
      photoRemovals: [id],
      photoUpserts: promoted,
      outboxRemovals: queued.map((op) => op.seq),
    });
    return;
  }
  commit({
    photoRemovals: [id],
    photoUpserts: promoted,
    ops: [{ method: 'DELETE', path: photoPath(id) }],
  });
};
