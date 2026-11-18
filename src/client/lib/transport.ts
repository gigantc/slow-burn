//////////////////////////////////////
// Transport
// The only module that talks to the server for sync. Swap the network layer here.

import type { NextTimeNote, SyncResponse } from 'shared/types';
import { api, ApiRequestError } from '@/lib/api';
import type { OutboxOp } from '@/lib/types';

export type Outcome = 'ok' | 'retry' | 'drop' | 'auth';

/** retry: try again later. drop: the server will never accept this. auth: session expired. */
export const classify = (err: unknown): Exclude<Outcome, 'ok'> => {
  if (!(err instanceof ApiRequestError)) return 'retry';
  const { status } = err;
  if (status === 401) return 'auth';
  if (status === 0 || status >= 500 || status === 408 || status === 429) return 'retry';
  return 'drop';
};

export const sendOp = async (op: OutboxOp): Promise<{ outcome: Outcome; data?: unknown }> => {
  try {
    const data = await api<unknown>(op.path, { method: op.method, body: op.body });
    return { outcome: 'ok', data };
  } catch (err) {
    const outcome = classify(err);
    if (outcome === 'drop') console.warn('Dropping op the server rejected', op, err);
    return { outcome };
  }
};

export const pullAll = () => api<SyncResponse>('/sync');

export const fetchNextTime = (meatId: string) =>
  api<NextTimeNote | null>(`/cooks/next-time?meatId=${encodeURIComponent(meatId)}`);
