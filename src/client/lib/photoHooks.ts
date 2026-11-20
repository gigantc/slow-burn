//////////////////////////////////////
// Photo hooks (React access to the store)

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Photo, PhotoOwnerType } from 'shared/types';
import {
  addPhotos,
  commitDrafts,
  deletePhoto,
  makeDrafts,
  makeFeatured,
  setCaption,
  setFocus,
} from '@/lib/photoActions';
import type { DraftPhoto } from '@/lib/photoActions';
import { photoUrl } from '@/lib/photoInfo';
import type { PhotoSize } from '@/lib/photoInfo';
import { useStoreState } from '@/lib/storeHooks';

/** A photo to show: a stored one, or a draft that carries its own file. */
export type PhotoItem = Photo & { blob?: Blob };

/** What a photo screen can do with an owner's photos. Stored photos and drafts both provide it. */
export type PhotoOps = {
  photos: readonly PhotoItem[];
  add: (files: File[]) => Promise<unknown>;
  setCaption: (id: string, caption: string) => void;
  setFocus: (id: string, x: number | null, y: number | null) => void;
  makeFeatured: (id: string) => void;
  remove: (id: string) => void;
};

/** An entry's photos in their own order (the featured one is not moved to the front). */
export const usePhotos = (ownerType: PhotoOwnerType, ownerId: string | undefined) => {
  const { photos } = useStoreState();
  return useMemo(
    () => photos.filter((photo) => photo.ownerType === ownerType && photo.ownerId === ownerId),
    [photos, ownerType, ownerId],
  );
};

/** The photo to show for an entry: its featured one, else its first. */
export const useFeaturedPhoto = (
  ownerType: PhotoOwnerType,
  ownerId: string | undefined,
): Photo | undefined => {
  const photos = usePhotos(ownerType, ownerId);
  return photos.find((photo) => photo.featured) ?? photos[0];
};

/** The photo operations for a cook or tasting that exists: everything saves straight away. */
export const useStoredPhotos = (ownerType: PhotoOwnerType, ownerId: string): PhotoOps => {
  const photos = usePhotos(ownerType, ownerId);
  return useMemo(
    () => ({
      photos,
      add: (files) => addPhotos(ownerType, ownerId, files),
      setCaption,
      setFocus,
      makeFeatured,
      remove: (id) => void deletePhoto(id),
    }),
    [photos, ownerType, ownerId],
  );
};

/** The same operations for a new tasting: photos wait in the form until `commit` (after Save). */
export const useDraftPhotos = (
  ownerType: PhotoOwnerType,
  ownerId: string,
): PhotoOps & { commit: () => void } => {
  const [drafts, setDrafts] = useState<DraftPhoto[]>([]);

  const add = useCallback(
    async (files: File[]) => {
      const added = await makeDrafts(ownerType, ownerId, drafts, files);
      setDrafts((current) => [
        ...current,
        ...added.map((draft, i) => ({
          ...draft,
          featured: current.length === 0 && i === 0,
          sort: current.length + i,
        })),
      ]);
    },
    [ownerType, ownerId, drafts],
  );

  return useMemo(
    () => ({
      photos: drafts,
      add,
      setCaption: (id, text) =>
        setDrafts((list) =>
          list.map((d) => (d.id === id ? { ...d, caption: text.trim() || null } : d)),
        ),
      setFocus: (id, x, y) =>
        setDrafts((list) => list.map((d) => (d.id === id ? { ...d, focusX: x, focusY: y } : d))),
      makeFeatured: (id) => setDrafts((list) => list.map((d) => ({ ...d, featured: d.id === id }))),
      remove: (id) =>
        setDrafts((list) => {
          const rest = list.filter((d) => d.id !== id);
          const first = rest[0];
          return first && !rest.some((d) => d.featured)
            ? rest.map((d) => ({ ...d, featured: d === first }))
            : rest;
        }),
      commit: () => commitDrafts(drafts),
    }),
    [drafts, add],
  );
};

/**
 * Where to load a photo from: its local file while it's waiting to upload (an object URL, revoked
 * when the component goes away or the photo changes), otherwise the server's.
 */
export const usePhotoSrc = (photo: PhotoItem, size: PhotoSize): string | undefined => {
  const { pendingBlobs } = useStoreState();
  const blob = photo.blob ?? pendingBlobs.get(photo.id);
  const [local, setLocal] = useState<string>();

  useEffect(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    setLocal(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  if (!blob) return photoUrl(photo.id, size);
  return local;
};
