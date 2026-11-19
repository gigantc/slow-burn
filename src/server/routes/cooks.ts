//////////////////////////////////////
// Cooks, meats and cook events
// Client-generated ids, upserts, and last-write-wins on the client's `updatedAt`.

import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { meatKey } from '../../shared/meats.js';
import type {
  Cook,
  CookEvent,
  CookWithEvents,
  NextTimeNote,
  SyncResponse,
} from '../../shared/types.js';
import { db } from '../db/index.js';
import { detachPhotos, removePhotoFiles } from '../photos/cascade.js';
import { cookEvents, cooks, meats } from '../db/schema.js';
import { HttpError } from '../errors.js';
import {
  cookBody,
  cookParams,
  eventBody,
  eventParams,
  meatBody,
  meatParams,
  nextTimeQuery,
} from './schemas.js';
import { listPhotos } from './photos.js';
import { listTastings } from './tastings.js';

// `meat_id` is nullable in the table (it was added to existing rows); the API always sets it.
const toCook = ({ meatId, ...cook }: typeof cooks.$inferSelect): Cook[] =>
  meatId ? [{ ...cook, meatId }] : [];

export const cookRoutes: FastifyPluginAsyncTypebox = async (app) => {
  //////////////////////////////////////
  // Read path for the client cache

  app.get('/sync', async (): Promise<SyncResponse> => {
    const events = db.select().from(cookEvents).orderBy(asc(cookEvents.at)).all();
    const byCook = new Map<string, CookEvent[]>();
    for (const event of events) {
      byCook.set(event.cookId, [...(byCook.get(event.cookId) ?? []), event]);
    }

    const rows: CookWithEvents[] = db
      .select()
      .from(cooks)
      .all()
      .flatMap(toCook)
      .map((cook) => ({ ...cook, events: byCook.get(cook.id) ?? [] }));
    return {
      cooks: rows,
      meats: db.select().from(meats).all(),
      tastings: listTastings(),
      photos: listPhotos(),
    };
  });

  //////////////////////////////////////
  // Next-time note

  app.get(
    '/cooks/next-time',
    { schema: { querystring: nextTimeQuery } },
    async (request, reply) => {
      const row = db
        .select({ cook: cooks, meatName: meats.name })
        .from(cooks)
        .innerJoin(meats, eq(meats.id, cooks.meatId))
        .where(
          and(
            eq(cooks.meatId, request.query.meatId),
            // Finished: anything but a cook still on the pit
            sql`not (${cooks.source} = 'app' and ${cooks.startedAt} is not null and ${cooks.endedAt} is null)`,
            sql`trim(coalesce(${cooks.nextTimeNote}, '')) <> ''`,
          ),
        )
        .orderBy(desc(sql`coalesce(${cooks.cookedOn}, ${cooks.endedAt}, ${cooks.createdAt})`))
        .limit(1)
        .get();

      const { cook } = row ?? {};
      const date = cook?.cookedOn ?? cook?.endedAt ?? cook?.createdAt;
      if (!row || !date || !cook?.nextTimeNote || !cook.meatId) return reply.send(null);
      const note: NextTimeNote = {
        cookId: cook.id,
        meatId: cook.meatId,
        meatName: row.meatName,
        date,
        nextTimeNote: cook.nextTimeNote,
      };
      return reply.send(note);
    },
  );

  //////////////////////////////////////
  // Meats: a managed list, deduplicated by normalized name

  app.put('/meats/:id', { schema: { params: meatParams, body: meatBody } }, async (request) => {
    const { id } = request.params;
    const { createdAt, ...fields } = request.body;
    const name = fields.name.trim();
    const nameKey = meatKey(name);
    if (!nameKey) throw new HttpError(400, 'invalid_request', 'Meat needs a name.');

    return db.transaction((tx) => {
      // Same meat under another id (e.g. added on two devices): hand back the existing one and
      // the client remaps its cooks to it.
      const sameKey = tx.select().from(meats).where(eq(meats.nameKey, nameKey)).get();
      if (sameKey && sameKey.id !== id) return sameKey;

      const existing = tx.select().from(meats).where(eq(meats.id, id)).get();
      if (existing && existing.updatedAt > fields.updatedAt) return existing;

      const values = { name, nameKey, updatedAt: fields.updatedAt };
      tx.insert(meats)
        .values({ id, ...values, ...(createdAt ? { createdAt } : {}) })
        .onConflictDoUpdate({ target: meats.id, set: values })
        .run();
      return tx.select().from(meats).where(eq(meats.id, id)).get()!;
    });
  });

  //////////////////////////////////////
  // Cook upsert and delete

  app.put('/cooks/:id', { schema: { params: cookParams, body: cookBody } }, async (request) => {
    const { id } = request.params;
    const { createdAt, ...values } = request.body;

    return db.transaction((tx) => {
      if (!tx.select({ id: meats.id }).from(meats).where(eq(meats.id, values.meatId)).get()) {
        throw new HttpError(404, 'meat_not_found', 'Meat not found.');
      }

      const existing = tx.select().from(cooks).where(eq(cooks.id, id)).get();
      if (existing && existing.updatedAt > values.updatedAt) return toCook(existing)[0] ?? existing;

      tx.insert(cooks)
        .values({ id, ...values, ...(createdAt ? { createdAt } : {}) })
        .onConflictDoUpdate({ target: cooks.id, set: values })
        .run();
      return tx.select().from(cooks).where(eq(cooks.id, id)).get()!;
    });
  });

  app.delete('/cooks/:id', { schema: { params: cookParams } }, async (request, reply) => {
    const { id } = request.params;
    const photoIds = db.transaction((tx) => {
      const ids = detachPhotos(tx, 'cook', id);
      tx.delete(cooks).where(eq(cooks.id, id)).run();
      return ids;
    });
    await removePhotoFiles(photoIds);
    return reply.status(204).send();
  });

  //////////////////////////////////////
  // Event upsert and delete

  app.put(
    '/cooks/:id/events/:eventId',
    { schema: { params: eventParams, body: eventBody } },
    async (request) => {
      const { id: cookId, eventId } = request.params;
      const { createdAt, ...fields } = request.body;

      return db.transaction((tx) => {
        if (!tx.select({ id: cooks.id }).from(cooks).where(eq(cooks.id, cookId)).get()) {
          throw new HttpError(404, 'cook_not_found', 'Cook not found.');
        }

        const existing = tx.select().from(cookEvents).where(eq(cookEvents.id, eventId)).get();
        if (existing && existing.cookId !== cookId) {
          throw new HttpError(409, 'event_conflict', 'Event belongs to another cook.');
        }
        if (existing && existing.updatedAt > fields.updatedAt) return existing;

        tx.insert(cookEvents)
          .values({ id: eventId, cookId, ...fields, ...(createdAt ? { createdAt } : {}) })
          .onConflictDoUpdate({ target: cookEvents.id, set: fields })
          .run();
        return tx.select().from(cookEvents).where(eq(cookEvents.id, eventId)).get()!;
      });
    },
  );

  app.delete(
    '/cooks/:id/events/:eventId',
    { schema: { params: eventParams } },
    async (request, reply) => {
      const { id: cookId, eventId } = request.params;
      db.delete(cookEvents)
        .where(and(eq(cookEvents.id, eventId), eq(cookEvents.cookId, cookId)))
        .run();
      return reply.status(204).send();
    },
  );
};
