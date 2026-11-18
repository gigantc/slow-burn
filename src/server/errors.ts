//////////////////////////////////////
// Error shape
// Every API error is { error: { code, message } }.

import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import type { ApiError } from '../shared/types.js';

export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const errorBody = (code: string, message: string): ApiError => ({
  error: { code, message },
});

export const errorHandler = (
  err: FastifyError | HttpError,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  if (err instanceof HttpError) {
    return reply.status(err.statusCode).send(errorBody(err.code, err.message));
  }

  if ('validation' in err && err.validation) {
    return reply.status(400).send(errorBody('invalid_request', 'Invalid request.'));
  }

  const status = err.statusCode ?? 500;
  if (status >= 500) {
    request.log.error(err);
    return reply.status(status).send(errorBody('internal_error', 'Something went wrong.'));
  }

  return reply.status(status).send(errorBody('request_error', err.message));
};
