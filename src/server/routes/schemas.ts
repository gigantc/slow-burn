//////////////////////////////////////
// Request schemas (TypeBox)

import { Type } from 'typebox';
import type { TSchema } from 'typebox';
import { cookEventTypeKeys } from '../../shared/cookEventTypes.js';
import { RATING_MAX, RATING_MIN } from '../../shared/constants.js';

// Null first: Fastify's Ajv coerces types, and would turn null into "" or 0 if the other branch led.
const nullable = <T extends TSchema>(schema: T) => Type.Union([Type.Null(), schema]);

// UTC ISO timestamps only, so string comparison is chronological (last-write-wins relies on it).
const isoTimestamp = () =>
  Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{1,3})?Z$' });

// A local calendar date, YYYY-MM-DD.
const calendarDate = () => Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' });

const text = (maxLength: number) => nullable(Type.String({ maxLength }));

export const idParam = Type.String({ pattern: '^[A-Za-z0-9_-]{1,64}$' });

export const cookParams = Type.Object({ id: idParam });
export const eventParams = Type.Object({ id: idParam, eventId: idParam });

export const cookBody = Type.Object({
  meatId: idParam,
  weightLbs: nullable(Type.Number({ minimum: 0, maximum: 1000 })),
  prep: text(5000),
  smoker: text(200),
  wood: text(200),
  // Optional: requests queued before these columns existed still validate.
  charcoal: Type.Optional(text(200)),
  targetPitTempF: nullable(Type.Integer({ minimum: 0, maximum: 1500 })),
  targetInternalTempF: nullable(Type.Integer({ minimum: 0, maximum: 1500 })),
  cookedOn: Type.Optional(nullable(calendarDate())),
  startedAt: nullable(isoTimestamp()),
  endedAt: nullable(isoTimestamp()),
  finalInternalTempF: nullable(Type.Integer({ minimum: 0, maximum: 1500 })),
  rating: nullable(Type.Integer({ minimum: RATING_MIN, maximum: RATING_MAX })),
  notes: text(20000),
  nextTimeNote: text(20000),
  source: Type.Union([Type.Literal('app'), Type.Literal('import')]),
  createdAt: Type.Optional(isoTimestamp()),
  updatedAt: isoTimestamp(),
});

export const meatParams = Type.Object({ id: idParam });

export const meatBody = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  createdAt: Type.Optional(isoTimestamp()),
  updatedAt: isoTimestamp(),
});

export const eventBody = Type.Object({
  type: Type.Union(cookEventTypeKeys.map((key) => Type.Literal(key))),
  at: isoTimestamp(),
  value: nullable(Type.Number({ minimum: -1000, maximum: 100000 })),
  note: text(2000),
  createdAt: Type.Optional(isoTimestamp()),
  updatedAt: isoTimestamp(),
});

export const nextTimeQuery = Type.Object({ meatId: idParam });
