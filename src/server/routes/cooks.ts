//////////////////////////////////////
// Cooks (stub: proves the DB wiring, no CRUD yet)

import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { db } from '../db/index.js';
import { cooks } from '../db/schema.js';

export const cookRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.get('/cooks', async () => db.select().from(cooks).all());
};
