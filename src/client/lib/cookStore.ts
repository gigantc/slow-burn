//////////////////////////////////////
// Cook store
// In-memory state (what the UI reads) mirrored to IndexedDB. Every mutation updates memory
// synchronously, then persists the change and its outbox ops in one transaction.

import type { CookWithEvents, Meat } from 'shared/types';
import { dbGetAll, dbWrite } from '@/lib/idb';
import type { WriteOp } from '@/lib/idb';
import type { NewOutboxOp, OutboxOp, SyncState } from '@/lib/types';

type CookState = {
  ready: boolean;
  cooks: readonly CookWithEvents[];
  meats: readonly Meat[];
};

let cookState: CookState = { ready: false, cooks: [], meats: [] };
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
  const [cooks, meats] = await Promise.all([
    dbGetAll<CookWithEvents>('cooks'),
    dbGetAll<Meat>('meats'),
  ]);
  // Cooks saved before meats existed have no meatId; the next pull replaces them.
  cookState = { ready: true, cooks: sorted(cooks.filter((cook) => cook.meatId)), meats };
  emit();
  await countPending();
};

//////////////////////////////////////
// Local mutations

type Mutation = {
  upserts?: CookWithEvents[];
  meatUpserts?: Meat[];
  removals?: string[];
  ops?: NewOutboxOp[];
};

export const mutate = ({
  upserts = [],
  meatUpserts = [],
  removals = [],
  ops = [],
}: Mutation): Promise<void> => {
  version += 1;

  const byId = new Map(cookState.cooks.map((cook) => [cook.id, cook]));
  upserts.forEach((cook) => byId.set(cook.id, cook));
  removals.forEach((id) => byId.delete(id));
  const meatsById = new Map(cookState.meats.map((meat) => [meat.id, meat]));
  meatUpserts.forEach((meat) => meatsById.set(meat.id, meat));
  cookState = { ready: true, cooks: sorted(byId.values()), meats: [...meatsById.values()] };
  syncState = { ...syncState, pending: syncState.pending + ops.length };
  emit();

  const now = new Date().toISOString();
  const writes: WriteOp[] = [
    ...upserts.map((cook) => ({ store: 'cooks' as const, put: cook })),
    ...meatUpserts.map((meat) => ({ store: 'meats' as const, put: meat })),
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
const MEAT_PATH = /^\/meats\/([^/]+)/;

/** Cook ids that still have unsent ops; the pull must not overwrite them. */
export const pendingCookIds = (ops: OutboxOp[]) =>
  new Set(ops.flatMap((op) => COOK_PATH.exec(op.path)?.[1] ?? []));

/** Meat ids that still have unsent ops. */
export const pendingMeatIds = (ops: OutboxOp[]) =>
  new Set(ops.flatMap((op) => MEAT_PATH.exec(op.path)?.[1] ?? []));

/**
 * Merge the server's cooks into the cache. Records with pending ops stay as they are; every
 * other record becomes the server's version (the server already resolved last-write-wins).
 * Returns false (and changes nothing) if a local mutation happened since `readVersion`.
 */
export const applyPull = (
  serverCooks: CookWithEvents[],
  serverMeats: Meat[],
  pendingIds: Set<string>,
  pendingMeats: Set<string>,
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

  const meatsNext = new Map<string, Meat>();
  const serverMeatIds = new Set(serverMeats.map((meat) => meat.id));
  for (const meat of cookState.meats) {
    if (pendingMeats.has(meat.id)) meatsNext.set(meat.id, meat);
    else if (!serverMeatIds.has(meat.id)) writes.push({ store: 'meats', delete: meat.id });
  }
  for (const meat of serverMeats) {
    if (pendingMeats.has(meat.id)) continue;
    meatsNext.set(meat.id, meat);
    writes.push({ store: 'meats', put: meat });
  }

  cookState = { ready: true, cooks: sorted(next.values()), meats: [...meatsNext.values()] };
  emit();
  dbWrite(writes).catch((err) => console.error('Could not save to IndexedDB', err));
  return true;
};

//////////////////////////////////////
// Meat remap
// The server answered a meat upsert with an existing meat of the same name (e.g. added on two
// devices). Point local cooks at it and drop the duplicate.

export const remapMeat = (oldId: string, meat: Meat): Promise<void> => {
  version += 1;
  const writes: WriteOp[] = [
    { store: 'meats', delete: oldId },
    { store: 'meats', put: meat },
  ];

  const cooks = cookState.cooks.map((cook) => {
    if (cook.meatId !== oldId) return cook;
    const moved = { ...cook, meatId: meat.id };
    writes.push({ store: 'cooks', put: moved });
    return moved;
  });
  cookState = {
    ready: true,
    cooks: sorted(cooks),
    meats: [...cookState.meats.filter((m) => m.id !== oldId && m.id !== meat.id), meat],
  };
  emit();

  // Unsent cook upserts still carry the old id in their body.
  return dbGetAll<OutboxOp>('outbox').then((ops) => {
    for (const op of ops) {
      const body = op.body as { meatId?: string } | undefined;
      if (op.method === 'PUT' && COOK_PATH.test(op.path) && body?.meatId === oldId) {
        writes.push({ store: 'outbox', put: { ...op, body: { ...body, meatId: meat.id } } });
      }
    }
    return dbWrite(writes);
  });
};
