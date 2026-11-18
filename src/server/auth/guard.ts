//////////////////////////////////////
// Auth guard
// The one place that decides who gets into /api. Register it on the scope that holds
// protected routes; public routes live outside that scope.

import type { FastifyReply, FastifyRequest } from 'fastify';
import { HttpError } from '../errors.js';

export const requireAuth = async (request: FastifyRequest, _reply: FastifyReply) => {
  if (request.session.get('authenticated') !== true) {
    throw new HttpError(401, 'unauthorized', 'Sign in required.');
  }
};
