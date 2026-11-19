//////////////////////////////////////
// Photo uploads: what happens when the outbox sends (or gives up on) one
// The sync engine calls settleUpload after every POST op. Kept out of sync.ts so the engine stays
// generic.

import type { Photo } from 'shared/types';
import { dbGetAll } from '@/lib/idb';
import { getStoreState, mutate, setNotice } from '@/lib/store';
import type { Outcome } from '@/lib/transport';
import type { OutboxOp } from '@/lib/types';

const REJECTED: Record<number, string> = {
  413: "A photo was too large to upload and wasn't saved.",
  415: "A photo's format isn't supported and it wasn't saved. Use JPEG or PNG.",
};

/**
 * The upload went through (the server's row replaces the local one and the blob is cleared), or
 * the server refused it for good (the local photo is dropped and the person is told). A retry
 * outcome leaves everything in place.
 */
export const settleUpload = async (
  op: OutboxOp,
  outcome: Outcome,
  data: unknown,
  status?: number,
) => {
  const id = op.path.slice('/photos/'.length);

  if (outcome === 'ok') {
    const row = data as Photo;
    if (getStoreState().photos.some((photo) => photo.id === id)) {
      await mutate({ photoUpserts: [row], blobRemovals: [id] });
    } else {
      // Deleted while the upload was on its way: the server has it now, so ask it to drop it
      await mutate({ blobRemovals: [id], ops: [{ method: 'DELETE', path: `/photos/${id}` }] });
    }
    return;
  }

  if (outcome !== 'drop') return;

  // Anything queued for this photo after its upload can't work either
  const queued = (await dbGetAll<OutboxOp>('outbox')).filter(
    (other) => other.path === op.path && other.seq !== op.seq,
  );
  await mutate({
    photoRemovals: [id],
    outboxRemovals: queued.map((other) => other.seq),
  });
  // A photo whose cook or tasting is gone isn't worth a message
  if (status !== 404) setNotice(REJECTED[status ?? 0] ?? "A photo couldn't be uploaded.");
};
