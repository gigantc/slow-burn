//////////////////////////////////////
// Database schema
// Source of truth. Generate migrations with `npm run db:generate`; never hand-edit them.

import { sql } from 'drizzle-orm';
import { index, uniqueIndex, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type { CookEventTypeKey } from '../../shared/cookEventTypes.js';

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

//////////////////////////////////////
// Meats
// A managed list. `nameKey` is the name lowercased with every non-alphanumeric removed, so
// "Pulled Pork", "pulled  pork" and "pulledpork" are the same meat.

export const meats = sqliteTable(
  'meats',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    nameKey: text('name_key').notNull(),
    createdAt: text('created_at').notNull().default(now),
    updatedAt: text('updated_at').notNull().default(now),
  },
  (t) => [uniqueIndex('meats_name_key_idx').on(t.nameKey)],
);

//////////////////////////////////////
// Cooks
// Only `name` is required. A cook with zero events is a normal record.
// `updatedAt` is client-supplied: sync is last-write-wins on it.

export const cooks = sqliteTable(
  'cooks',
  {
    id: text('id').primaryKey(),
    weightLbs: real('weight_lbs'),
    prep: text('prep'),
    smoker: text('smoker'),
    wood: text('wood'),
    charcoal: text('charcoal'),
    targetPitTempF: integer('target_pit_temp_f'),
    targetInternalTempF: integer('target_internal_temp_f'),
    // Required by the API; nullable here because the column was added to existing rows.
    meatId: text('meat_id').references(() => meats.id, { onDelete: 'restrict' }),
    // The local calendar date (YYYY-MM-DD) of a cook logged after the fact, when its start and
    // end times aren't known. Cooks with times derive their date from startedAt.
    cookedOn: text('cooked_on'),
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
  (t) => [index('cooks_meat_idx').on(t.meatId)],
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
