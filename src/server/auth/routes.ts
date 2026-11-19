//////////////////////////////////////
// Auth routes

import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from 'typebox';
import type { Me } from '../../shared/types.js';
import { config } from '../config.js';
import { HttpError } from '../errors.js';
import { verifyPassword } from './password.js';
import { loginLimiter } from './rateLimit.js';

//////////////////////////////////////
// Public (no guard)

export const publicAuthRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.post(
    '/auth/login',
    { schema: { body: Type.Object({ password: Type.String({ minLength: 1, maxLength: 200 }) }) } },
    async (request, reply) => {
      // Checked before scrypt so a blocked caller costs nothing
      const hasSession = request.session.get('authenticated') === true;
      const retryAfter = loginLimiter.check(request.ip, hasSession);
      if (retryAfter > 0) {
        reply.header('Retry-After', retryAfter);
        throw new HttpError(429, 'too_many_attempts', 'Too many attempts. Try again later.');
      }

      const ok = await verifyPassword(request.body.password, config.passwordHash);
      if (!ok) {
        loginLimiter.fail(request.ip);
        throw new HttpError(401, 'invalid_credentials', 'Wrong password.');
      }

      loginLimiter.succeed(request.ip);
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
