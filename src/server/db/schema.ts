//////////////////////////////////////
// Database schema
// Source of truth. Generate migrations with `npm run db:generate`; never hand-edit them.

import { sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type { CookEventTypeKey } from '../../shared/cookEventTypes.js';

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

//////////////////////////////////////
// Cooks
// Only `name` is required. A cook with zero events is a normal record.
// `updatedAt` is client-supplied: sync is last-write-wins on it.

export const cooks = sqliteTable(
  'cooks',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    protein: text('protein'),
    // Lowercased, trimmed copy of `protein` for the indexed next-time lookup. The API keeps it
    // in step on every write (a generated column breaks drizzle-kit's table recreate).
    proteinKey: text('protein_key'),
    cut: text('cut'),
    weightLbs: real('weight_lbs'),
    prep: text('prep'),
    smoker: text('smoker'),
    wood: text('wood'),
    targetPitTempF: integer('target_pit_temp_f'),
    startedAt: text('started_at'),
    endedAt: text('ended_at'),
    finalInternalTempF: integer('final_internal_temp_f'),
    // 5 stars (1-5), same scale for tastings later. Enforced at the API: a CHECK would force
    // drizzle-kit to recreate the table, which is unsafe with the cook_events cascade.
    rating: integer('rating'),
    notes: text('notes'),
    nextTimeNote: text('next_time_note'),
    source: text('source', { enum: ['app', 'import'] })
      .notNull()
      .default('app'),
    createdAt: text('created_at').notNull().default(now),
    updatedAt: text('updated_at').notNull().default(now),
  },
  (t) => [index('cooks_protein_key_idx').on(t.proteinKey)],
);

//////////////////////////////////////
// Cook events

export const cookEvents = sqliteTable(
  'cook_events',
  {
    id: text('id').primaryKey(),
    cookId: text('cook_id')
      .notNull()
      .references(() => cooks.id, { onDelete: 'cascade' }),
    type: text('type').$type<CookEventTypeKey>().notNull(),
    at: text('at').notNull(),
    value: real('value'),
    note: text('note'),
    createdAt: text('created_at').notNull().default(now),
    // Constant default (SQLite can't add a column with an expression default to existing rows).
    updatedAt: text('updated_at').notNull().default('1970-01-01T00:00:00.000Z'),
  },
  (t) => [index('cook_events_cook_idx').on(t.cookId)],
);
