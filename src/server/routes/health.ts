//////////////////////////////////////
// Health check (unauthenticated, used by deploy.sh)

import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

export const healthRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.get('/health', async () => ({ ok: true }));
};
