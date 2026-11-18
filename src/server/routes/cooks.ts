//////////////////////////////////////
// Cooks and cook events
// Client-generated ids, upserts, and last-write-wins on the client's `updatedAt`.

import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { and, asc, desc, eq, isNotNull, sql } from 'drizzle-orm';
import type { CookEvent, CookWithEvents, NextTimeNote, SyncResponse } from '../../shared/types.js';
import { db } from '../db/index.js';
import { cookEvents, cooks } from '../db/schema.js';
import { HttpError } from '../errors.js';
import { cookBody, cookParams, eventBody, eventParams, nextTimeQuery } from './schemas.js';

const normalizeProtein = (protein: string | null) => protein?.trim().toLowerCase() || null;

// Drop the internal lookup column from API output.
const toCook = ({ proteinKey: _proteinKey, ...cook }: typeof cooks.$inferSelect) => cook;

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
      .map((cook) => ({ ...toCook(cook), events: byCook.get(cook.id) ?? [] }));
    return { cooks: rows };
  });

  //////////////////////////////////////
  // Next-time note

  app.get(
    '/cooks/next-time',
    { schema: { querystring: nextTimeQuery } },
    async (request, reply) => {
      const key = normalizeProtein(request.query.protein);
      if (!key) return reply.send(null);

      const row = db
        .select()
        .from(cooks)
        .where(
          and(
            eq(cooks.proteinKey, key),
            isNotNull(cooks.endedAt),
            sql`trim(coalesce(${cooks.nextTimeNote}, '')) <> ''`,
          ),
        )
        .orderBy(desc(cooks.endedAt))
        .limit(1)
        .get();

      if (!row?.endedAt || !row.nextTimeNote) return reply.send(null);
      const note: NextTimeNote = {
        cookId: row.id,
        name: row.name,
        endedAt: row.endedAt,
        nextTimeNote: row.nextTimeNote,
      };
      return reply.send(note);
    },
  );

  //////////////////////////////////////
  // Cook upsert and delete

  app.put('/cooks/:id', { schema: { params: cookParams, body: cookBody } }, async (request) => {
    const { id } = request.params;
    const { createdAt, ...fields } = request.body;
    const values = { ...fields, proteinKey: normalizeProtein(fields.protein) };

    return db.transaction((tx) => {
      const existing = tx.select().from(cooks).where(eq(cooks.id, id)).get();
      if (existing && existing.updatedAt > fields.updatedAt) return toCook(existing);

      tx.insert(cooks)
        .values({ id, ...values, ...(createdAt ? { createdAt } : {}) })
        .onConflictDoUpdate({ target: cooks.id, set: values })
        .run();
      return toCook(tx.select().from(cooks).where(eq(cooks.id, id)).get()!);
    });
  });

  app.delete('/cooks/:id', { schema: { params: cookParams } }, async (request, reply) => {
    db.delete(cooks).where(eq(cooks.id, request.params.id)).run();
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
