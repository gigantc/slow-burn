//////////////////////////////////////
// Auth routes

import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from 'typebox';
import type { Me } from '../../shared/types.js';
import { config } from '../config.js';
import { HttpError } from '../errors.js';
import { verifyPassword } from './password.js';

//////////////////////////////////////
// Public (no guard)

export const publicAuthRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.post(
    '/auth/login',
    { schema: { body: Type.Object({ password: Type.String({ minLength: 1, maxLength: 200 }) }) } },
    async (request) => {
      const ok = await verifyPassword(request.body.password, config.passwordHash);
      if (!ok) throw new HttpError(401, 'invalid_credentials', 'Wrong password.');

      request.session.set('authenticated', true);
      return { authenticated: true } satisfies Me;
    },
  );

  app.post('/auth/logout', async (request, reply) => {
    request.session.delete();
    return reply.status(204).send();
  });
};

//////////////////////////////////////
// Guarded

export const guardedAuthRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.get('/auth/me', async () => ({ authenticated: true }) satisfies Me);
};
