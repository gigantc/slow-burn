//////////////////////////////////////
// Photos
// Upload (multipart, idempotent on the client's id), edit, delete, and the image files. Metadata
// syncs like everything else (/sync); the bytes only move here. The files are behind
// photos/storage.ts.

import multipart from '@fastify/multipart';
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { and, asc, eq, ne, sql } from 'drizzle-orm';
import type { Photo, PhotoOwnerType } from '../../shared/types.js';
import { db } from '../db/index.js';
import { cooks, photos, tastings } from '../db/schema.js';
import { HttpError } from '../errors.js';
import { processPhoto } from '../photos/process.js';
import { removePhotoFiles } from '../photos/cascade.js';
import { photoStorage } from '../photos/storage.js';
import {
  ID_PATTERN,
  PHOTO_CAPTION_MAX,
  photoParams,
  photoPatchBody,
  photoQuery,
} from './schemas.js';

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

const OWNER_TYPES: readonly PhotoOwnerType[] = ['cook', 'tasting'];

const byOrder = [asc(photos.sort), asc(photos.createdAt), asc(photos.id)];

/** Every photo's metadata, in display order within each owner. Shared with /sync. */
export const listPhotos = (): Photo[] =>
  db
    .select()
    .from(photos)
    .orderBy(...byOrder)
    .all();

const findPhoto = (id: string) => db.select().from(photos).where(eq(photos.id, id)).get();

const ownerExists = (ownerType: PhotoOwnerType, ownerId: string) =>
  ownerType === 'cook'
    ? Boolean(db.select({ id: cooks.id }).from(cooks).where(eq(cooks.id, ownerId)).get())
    : Boolean(db.select({ id: tastings.id }).from(tastings).where(eq(tastings.id, ownerId)).get());

type Upload = {
  id: string;
  ownerType: PhotoOwnerType;
  ownerId: string;
  caption: string | null;
  file: Buffer;
};

/** Read the multipart body (fields and file in any order) and check it. */
const readUpload = async (
  parts: AsyncIterable<import('@fastify/multipart').Multipart>,
): Promise<Upload> => {
  const fields: Record<string, string> = {};
  let file: Buffer | undefined;

  try {
    for await (const part of parts) {
      if (part.type === 'file') {
        // Only the first file counts; the rest are drained and ignored
        const bytes = await part.toBuffer();
        file ??= bytes;
      } else if (typeof part.value === 'string') {
        fields[part.fieldname] = part.value;
      }
    }
  } catch (err) {
    if ((err as { code?: string }).code === 'FST_REQ_FILE_TOO_LARGE') {
      throw new HttpError(413, 'photo_too_large', 'That photo is over 15 MB.');
    }
    throw err;
  }

  const { id, ownerType, ownerId, caption } = fields;
  if (!file || file.length === 0) throw new HttpError(400, 'invalid_request', 'No photo was sent.');
  if (!id || !ID_PATTERN.test(id)) throw new HttpError(400, 'invalid_request', 'Invalid photo id.');
  if (!ownerType || !OWNER_TYPES.includes(ownerType as PhotoOwnerType)) {
    throw new HttpError(400, 'invalid_request', 'Invalid owner type.');
  }
  if (!ownerId || !ID_PATTERN.test(ownerId)) {
    throw new HttpError(400, 'invalid_request', 'Invalid owner id.');
  }
  if (caption !== undefined && caption.length > PHOTO_CAPTION_MAX) {
    throw new HttpError(400, 'invalid_request', 'Caption is too long.');
  }
  return {
    id,
    ownerType: ownerType as PhotoOwnerType,
    ownerId,
    caption: caption?.trim() || null,
    file,
  };
};

export const photoRoutes: FastifyPluginAsyncTypebox = async (app) => {
  await app.register(multipart, { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } });

  //////////////////////////////////////
  // Upload

  app.post('/photos', async (request, reply) => {
    if (!request.isMultipart()) {
      throw new HttpError(400, 'invalid_request', 'Send the photo as multipart form data.');
    }
    const upload = await readUpload(request.parts());

    // A retry of an upload that already went through
    const existing = findPhoto(upload.id);
    if (existing) return reply.send(existing);

    if (!ownerExists(upload.ownerType, upload.ownerId)) {
      throw new HttpError(404, 'owner_not_found', 'That cook or tasting was not found.');
    }

    const processed = await processPhoto(upload.file);
    await photoStorage.save(upload.id, processed);

    try {
      const row = db.transaction((tx) => {
        const owner = and(
          eq(photos.ownerType, upload.ownerType),
          eq(photos.ownerId, upload.ownerId),
        );
        const { count, top } = tx
          .select({
            count: sql<number>`count(*)`,
            top: sql<number>`coalesce(max(${photos.sort}), -1)`,
          })
          .from(photos)
          .where(owner)
          .get()!;

        tx.insert(photos)
          .values({
            id: upload.id,
            ownerType: upload.ownerType,
            ownerId: upload.ownerId,
            // The first photo of an entry is its featured one
            featured: count === 0,
            sort: top + 1,
            caption: upload.caption,
            width: processed.width,
            height: processed.height,
          })
          .onConflictDoNothing()
          .run();
        return tx.select().from(photos).where(eq(photos.id, upload.id)).get()!;
      });
      return reply.status(201).send(row);
    } catch (err) {
      // The row didn't land; don't leave its files behind (unless a parallel retry created it)
      if (!findPhoto(upload.id)) await photoStorage.remove(upload.id);
      throw err;
    }
  });

  //////////////////////////////////////
  // Edit: caption, featured, sort (last-write-wins on updatedAt)

  app.patch(
    '/photos/:id',
    { schema: { params: photoParams, body: photoPatchBody } },
    async (request) => {
      const { id } = request.params;
      const { caption, featured, sort, updatedAt } = request.body;

      return db.transaction((tx) => {
        const current = tx.select().from(photos).where(eq(photos.id, id)).get();
        if (!current) throw new HttpError(404, 'photo_not_found', 'Photo not found.');
        if (current.updatedAt > updatedAt) return current;

        tx.update(photos)
          .set({
            ...(caption !== undefined && { caption: caption?.trim() || null }),
            ...(sort !== undefined && { sort }),
            ...(featured && { featured: true }),
            updatedAt,
          })
          .where(eq(photos.id, id))
          .run();

        if (featured) {
          tx.update(photos)
            .set({ featured: false, updatedAt })
            .where(
              and(
                eq(photos.ownerType, current.ownerType),
                eq(photos.ownerId, current.ownerId),
                ne(photos.id, id),
                eq(photos.featured, true),
              ),
            )
            .run();
        }
        return tx.select().from(photos).where(eq(photos.id, id)).get()!;
      });
    },
  );

  //////////////////////////////////////
  // Delete (the files too; if it was featured, the next photo takes over)

  app.delete('/photos/:id', { schema: { params: photoParams } }, async (request, reply) => {
    const { id } = request.params;

    const removed = db.transaction((tx) => {
      const current = tx.select().from(photos).where(eq(photos.id, id)).get();
      if (!current) return false;
      tx.delete(photos).where(eq(photos.id, id)).run();

      if (current.featured) {
        const next = tx
          .select({ id: photos.id })
          .from(photos)
          .where(and(eq(photos.ownerType, current.ownerType), eq(photos.ownerId, current.ownerId)))
          .orderBy(...byOrder)
          .limit(1)
          .get();
        if (next) {
          tx.update(photos)
            .set({ featured: true, updatedAt: new Date().toISOString() })
            .where(eq(photos.id, next.id))
            .run();
        }
      }
      return true;
    });

    if (removed) await removePhotoFiles([id]);
    return reply.status(204).send();
  });

  //////////////////////////////////////
  // The image itself. A photo's bytes never change (a new photo is a new id), so browsers may
  // keep them for good.

  app.get(
    '/photos/:id',
    { schema: { params: photoParams, querystring: photoQuery } },
    async (request, reply) => {
      const file = await photoStorage.read(request.params.id, request.query.size ?? 'display');
      if (!file) throw new HttpError(404, 'photo_not_found', 'Photo not found.');

      return reply
        .header('Content-Type', 'image/webp')
        .header('Content-Length', file.bytes)
        .header('Cache-Control', 'private, max-age=31536000, immutable')
        .send(file.stream);
    },
  );
};
