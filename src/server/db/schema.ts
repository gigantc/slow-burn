//////////////////////////////////////
// Database schema
// Source of truth. Generate migrations with `npm run db:generate`; never hand-edit them.

import { sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

//////////////////////////////////////
// Cooks
// Only `name` is required. A cook with zero events is a normal record.

export const cooks = sqliteTable('cooks', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  protein: text('protein'),
  cut: text('cut'),
  weightLbs: real('weight_lbs'),
  prep: text('prep'),
  smoker: text('smoker'),
  wood: text('wood'),
  targetPitTempF: integer('target_pit_temp_f'),
  startedAt: text('started_at'),
  endedAt: text('ended_at'),
  finalInternalTempF: integer('final_internal_temp_f'),
  // Scale undecided, so no check constraint yet.
  rating: integer('rating'),
  notes: text('notes'),
  nextTimeNote: text('next_time_note'),
  source: text('source', { enum: ['app', 'import'] })
    .notNull()
    .default('app'),
  createdAt: text('created_at').notNull().default(now),
  updatedAt: text('updated_at').notNull().default(now),
});

//////////////////////////////////////
// Cook events

export const cookEvents = sqliteTable('cook_events', {
  id: text('id').primaryKey(),
  cookId: text('cook_id')
    .notNull()
    .references(() => cooks.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  at: text('at').notNull(),
  value: real('value'),
  note: text('note'),
  createdAt: text('created_at').notNull().default(now),
});
