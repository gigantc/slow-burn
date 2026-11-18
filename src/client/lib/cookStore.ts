//////////////////////////////////////
// Cook store
// In-memory state (what the UI reads) mirrored to IndexedDB. Every mutation updates memory
// synchronously, then persists the change and its outbox ops in one transaction.

import type { CookWithEvents } from 'shared/types';
import { dbGetAll, dbWrite } from '@/lib/idb';
import type { WriteOp } from '@/lib/idb';
import type { NewOutboxOp, OutboxOp, SyncState } from '@/lib/types';

type CookState = { ready: boolean; cooks: readonly CookWithEvents[] };

let cookState: CookState = { ready: false, cooks: [] };
let syncState: SyncState = {
  pending: 0,
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  syncing: false,
  lastSynced: null,
};
let version = 0;

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getCookState = () => cookState;
export const getSyncState = () => syncState;

/** Bumps on every local mutation; sync uses it to detect writes that raced a pull. */
export const getMutationVersion = () => version;

//////////////////////////////////////
// State setters

const newest = (cook: CookWithEvents) => cook.startedAt ?? cook.createdAt;

const sorted = (cooks: Iterable<CookWithEvents>) =>
  [...cooks].sort((a, b) => newest(b).localeCompare(newest(a)));

export const setSyncState = (patch: Partial<SyncState>) => {
  syncState = { ...syncState, ...patch };
  emit();
};

export const countPending = async () => {
  const ops = await dbGetAll<OutboxOp>('outbox');
  setSyncState({ pending: ops.length });
};

//////////////////////////////////////
// Load

export const loadStore = async () => {
  const cooks = await dbGetAll<CookWithEvents>('cooks');
  cookState = { ready: true, cooks: sorted(cooks) };
  emit();
  await countPending();
};

//////////////////////////////////////
// Local mutations

type Mutation = {
  upserts?: CookWithEvents[];
  removals?: string[];
  ops?: NewOutboxOp[];
};

export const mutate = ({ upserts = [], removals = [], ops = [] }: Mutation): Promise<void> => {
  version += 1;

  const byId = new Map(cookState.cooks.map((cook) => [cook.id, cook]));
  upserts.forEach((cook) => byId.set(cook.id, cook));
  removals.forEach((id) => byId.delete(id));
  cookState = { ready: true, cooks: sorted(byId.values()) };
  syncState = { ...syncState, pending: syncState.pending + ops.length };
  emit();

  const now = new Date().toISOString();
  const writes: WriteOp[] = [
    ...upserts.map((cook) => ({ store: 'cooks' as const, put: cook })),
    ...removals.map((id) => ({ store: 'cooks' as const, delete: id })),
    ...ops.map((op) => ({
      store: 'outbox' as const,
      put: { id: crypto.randomUUID(), createdAt: now, ...op },
    })),
  ];

  return dbWrite(writes)
    .catch((err) => console.error('Could not save to IndexedDB', err))
    .then(countPending);
};

//////////////////////////////////////
// Server pull

const COOK_PATH = /^\/cooks\/([^/]+)/;

/** Cook ids that still have unsent ops; the pull must not overwrite them. */
export const pendingCookIds = (ops: OutboxOp[]) =>
  new Set(ops.flatMap((op) => COOK_PATH.exec(op.path)?.[1] ?? []));

/**
 * Merge the server's cooks into the cache. Records with pending ops stay as they are; every
 * other record becomes the server's version (the server already resolved last-write-wins).
 * Returns false (and changes nothing) if a local mutation happened since `readVersion`.
 */
export const applyPull = (
  serverCooks: CookWithEvents[],
  pendingIds: Set<string>,
  readVersion: number,
): boolean => {
  if (readVersion !== version) return false;

  const serverIds = new Set(serverCooks.map((cook) => cook.id));
  const next = new Map<string, CookWithEvents>();
  const writes: WriteOp[] = [];

  for (const cook of cookState.cooks) {
    if (pendingIds.has(cook.id)) next.set(cook.id, cook);
    else if (!serverIds.has(cook.id)) writes.push({ store: 'cooks', delete: cook.id });
  }
  for (const cook of serverCooks) {
    if (pendingIds.has(cook.id)) continue;
    next.set(cook.id, cook);
    writes.push({ store: 'cooks', put: cook });
  }

  cookState = { ready: true, cooks: sorted(next.values()) };
  emit();
  dbWrite(writes).catch((err) => console.error('Could not save to IndexedDB', err));
  return true;
};
