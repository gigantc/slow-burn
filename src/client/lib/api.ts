//////////////////////////////////////
// API wrapper
// Small fetch wrapper: JSON in and out, cookies included, errors in the server's shape.

import { API_BASE } from '@/config';
import type { ApiError } from 'shared/types';

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const api = async <T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> => {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: init.method ?? 'GET',
      credentials: 'same-origin',
      // FormData sets its own multipart Content-Type (with the boundary)
      headers:
        init.body === undefined || init.body instanceof FormData
          ? undefined
          : { 'Content-Type': 'application/json' },
      body:
        init.body === undefined || init.body instanceof FormData
          ? init.body
          : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiRequestError(0, 'network', 'No connection.');
  }

  if (res.status === 204) return undefined as T;

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (data as ApiError | null)?.error;
    throw new ApiRequestError(
      res.status,
      err?.code ?? 'unknown',
      err?.message ?? 'Request failed.',
    );
  }
  return data as T;
};
