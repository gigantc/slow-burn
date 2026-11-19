//////////////////////////////////////
// Transport
// The only module that talks to the server for sync. Swap the network layer here.

import type { NextTimeNote, Photo, SyncResponse } from 'shared/types';
import { api, ApiRequestError } from '@/lib/api';
import { dbGet } from '@/lib/idb';
import type { PhotoBlob } from '@/lib/store';
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

/** An upload op (POST /photos/:id) as the real request: multipart, the file read from its blob. */
const uploadRequest = async (op: OutboxOp) => {
  const id = op.path.slice('/photos/'.length);
  const stored = await dbGet<PhotoBlob>('photoBlobs', id);
  // No blob: the photo was cancelled or already uploaded. Nothing to send.
  if (!stored) return null;

  const meta = (op.body ?? {}) as { ownerType: string; ownerId: string; caption: string | null };
  const form = new FormData();
  form.set('id', id);
  form.set('ownerType', meta.ownerType);
  form.set('ownerId', meta.ownerId);
  if (meta.caption) form.set('caption', meta.caption);
  form.set('file', stored.blob, `${id}.jpg`);
  return form;
};

export const sendOp = async (
  op: OutboxOp,
): Promise<{ outcome: Outcome; data?: unknown; error?: ApiRequestError }> => {
  try {
    if (op.method === 'POST') {
      const form = await uploadRequest(op);
      if (!form) return { outcome: 'drop' };
      const photo = await api<Photo>('/photos', { method: 'POST', body: form });
      return { outcome: 'ok', data: photo };
    }
    const data = await api<unknown>(op.path, { method: op.method, body: op.body });
    return { outcome: 'ok', data };
  } catch (err) {
    const outcome = classify(err);
    if (outcome === 'drop') console.warn('Dropping op the server rejected', op, err);
    return { outcome, error: err instanceof ApiRequestError ? err : undefined };
  }
};

export const pullAll = () => api<SyncResponse>('/sync');

export const fetchNextTime = (meatId: string) =>
  api<NextTimeNote | null>(`/cooks/next-time?meatId=${encodeURIComponent(meatId)}`);
