//////////////////////////////////////
// Tastings
// Client-generated ids, upserts, and last-write-wins on the client's `updatedAt`.

import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { desc, eq, sql } from 'drizzle-orm';
import { cleanDetails } from '../../shared/tastingCategories.js';
import type { TastingCategoryKey } from '../../shared/tastingCategories.js';
import type { Tasting } from '../../shared/types.js';
import { db } from '../db/index.js';
import { detachPhotos, removePhotoFiles } from '../photos/cascade.js';
import { tastings } from '../db/schema.js';
import { HttpError } from '../errors.js';
import { tastingBody, tastingParams, tastingsQuery } from './schemas.js';

const toTasting = ({ details, ...row }: typeof tastings.$inferSelect): Tasting => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(details);
  } catch {
    parsed = {};
  }
  const clean = cleanDetails(row.category, (parsed ?? {}) as Record<string, unknown>);
  return { ...row, details: clean ?? {} };
};

/** Newest first. Shared with the client cache pull (/sync). */
export const listTastings = (category?: TastingCategoryKey): Tasting[] =>
  db
    .select()
    .from(tastings)
    .where(category ? eq(tastings.category, category) : undefined)
    .orderBy(desc(sql`coalesce(${tastings.tastedOn}, ${tastings.createdAt})`))
    .all()
    .map(toTasting);

export const tastingRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.get('/tastings', { schema: { querystring: tastingsQuery } }, async (request) =>
    listTastings(request.query.category),
  );

  app.put(
    '/tastings/:id',
    { schema: { params: tastingParams, body: tastingBody } },
    async (request) => {
      const { id } = request.params;
      const { createdAt, details: rawDetails, ...fields } = request.body;

      const name = fields.name.trim();
      if (!name) throw new HttpError(400, 'invalid_request', 'A tasting needs a name.');
      const details = cleanDetails(fields.category, rawDetails);
      if (!details) throw new HttpError(400, 'invalid_details', 'Invalid tasting details.');

      const values = { ...fields, name, details: JSON.stringify(details) };

      return db.transaction((tx) => {
        const existing = tx.select().from(tastings).where(eq(tastings.id, id)).get();
        if (existing && existing.updatedAt > values.updatedAt) return toTasting(existing);

        tx.insert(tastings)
          .values({ id, ...values, ...(createdAt ? { createdAt } : {}) })
          .onConflictDoUpdate({ target: tastings.id, set: values })
          .run();
        return toTasting(tx.select().from(tastings).where(eq(tastings.id, id)).get()!);
      });
    },
  );

  app.delete('/tastings/:id', { schema: { params: tastingParams } }, async (request, reply) => {
    const { id } = request.params;
    const photoIds = db.transaction((tx) => {
      const ids = detachPhotos(tx, 'tasting', id);
      tx.delete(tastings).where(eq(tastings.id, id)).run();
      return ids;
    });
    await removePhotoFiles(photoIds);
    return reply.status(204).send();
  });
};
