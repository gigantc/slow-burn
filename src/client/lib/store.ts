//////////////////////////////////////
// Store (cooks, meats, tastings)
// In-memory state (what the UI reads) mirrored to IndexedDB. Every mutation updates memory
// synchronously, then persists the change and its outbox ops in one transaction.

import type { CookWithEvents, Meat, SyncResponse, Tasting } from 'shared/types';
import { compareCooks } from '@/lib/cookInfo';
import { compareTastings } from '@/lib/tastingInfo';
import { dbGetAll, dbWrite } from '@/lib/idb';
import type { WriteOp } from '@/lib/idb';
import type { NewOutboxOp, OutboxOp, SyncState } from '@/lib/types';

type StoreState = {
  ready: boolean;
  cooks: readonly CookWithEvents[];
  meats: readonly Meat[];
  tastings: readonly Tasting[];
};

let storeState: StoreState = { ready: false, cooks: [], meats: [], tastings: [] };
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

export const getStoreState = () => storeState;
export const getSyncState = () => syncState;

/** Bumps on every local mutation; sync uses it to detect writes that raced a pull. */
export const getMutationVersion = () => version;

//////////////////////////////////////
// State setters

const sorted = (cooks: Iterable<CookWithEvents>) => [...cooks].sort(compareCooks);
const sortedTastings = (tastings: Iterable<Tasting>) => [...tastings].sort(compareTastings);

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
  const [cooks, meats, tastings] = await Promise.all([
    dbGetAll<CookWithEvents>('cooks'),
    dbGetAll<Meat>('meats'),
    dbGetAll<Tasting>('tastings'),
  ]);
  // Cooks saved before meats existed have no meatId; the next pull replaces them.
  storeState = {
    ready: true,
    cooks: sorted(cooks.filter((cook) => cook.meatId)),
    meats,
    tastings: sortedTastings(tastings),
  };
  emit();
  await countPending();
};

//////////////////////////////////////
// Local mutations

type Mutation = {
  upserts?: CookWithEvents[];
  meatUpserts?: Meat[];
  tastingUpserts?: Tasting[];
  removals?: string[];
  tastingRemovals?: string[];
  ops?: NewOutboxOp[];
};

export const mutate = ({
  upserts = [],
  meatUpserts = [],
  tastingUpserts = [],
  removals = [],
  tastingRemovals = [],
  ops = [],
}: Mutation): Promise<void> => {
  version += 1;

  const byId = new Map(storeState.cooks.map((cook) => [cook.id, cook]));
  upserts.forEach((cook) => byId.set(cook.id, cook));
  removals.forEach((id) => byId.delete(id));
  const meatsById = new Map(storeState.meats.map((meat) => [meat.id, meat]));
  meatUpserts.forEach((meat) => meatsById.set(meat.id, meat));
  const tastingsById = new Map(storeState.tastings.map((tasting) => [tasting.id, tasting]));
  tastingUpserts.forEach((tasting) => tastingsById.set(tasting.id, tasting));
  tastingRemovals.forEach((id) => tastingsById.delete(id));
  storeState = {
    ready: true,
    cooks: sorted(byId.values()),
    meats: [...meatsById.values()],
    tastings: sortedTastings(tastingsById.values()),
  };
  syncState = { ...syncState, pending: syncState.pending + ops.length };
  emit();

  const now = new Date().toISOString();
  const writes: WriteOp[] = [
    ...upserts.map((cook) => ({ store: 'cooks' as const, put: cook })),
    ...meatUpserts.map((meat) => ({ store: 'meats' as const, put: meat })),
    ...tastingUpserts.map((tasting) => ({ store: 'tastings' as const, put: tasting })),
    ...removals.map((id) => ({ store: 'cooks' as const, delete: id })),
    ...tastingRemovals.map((id) => ({ store: 'tastings' as const, delete: id })),
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

/** Ids of one collection (`cooks`, `meats`, `tastings`) that still have unsent ops. */
const pendingIds = (ops: OutboxOp[], collection: string) => {
  const path = new RegExp(`^/${collection}/([^/]+)`);
  return new Set(ops.flatMap((op) => path.exec(op.path)?.[1] ?? []));
};

/**
 * One collection's merge: records with pending ops stay as they are, records the server no
 * longer has are removed, everything else becomes the server's version. Pushes the IndexedDB
 * writes onto `writes`.
 */
const mergePulled = <T extends { id: string }>(
  store: 'cooks' | 'meats' | 'tastings',
  local: readonly T[],
  server: readonly T[],
  pending: Set<string>,
  writes: WriteOp[],
): T[] => {
  const serverIds = new Set(server.map((record) => record.id));
  const next = new Map<string, T>();

  for (const record of local) {
    if (pending.has(record.id)) next.set(record.id, record);
    else if (!serverIds.has(record.id)) writes.push({ store, delete: record.id });
  }
  for (const record of server) {
    if (pending.has(record.id)) continue;
    next.set(record.id, record);
    writes.push({ store, put: record });
  }
  return [...next.values()];
};

/**
 * Merge the server's snapshot into the cache (the server already resolved last-write-wins).
 * Returns false (and changes nothing) if a local mutation happened since `readVersion`.
 */
export const applyPull = (server: SyncResponse, ops: OutboxOp[], readVersion: number): boolean => {
  if (readVersion !== version) return false;

  const writes: WriteOp[] = [];
  storeState = {
    ready: true,
    cooks: sorted(
      mergePulled('cooks', storeState.cooks, server.cooks, pendingIds(ops, 'cooks'), writes),
    ),
    meats: mergePulled('meats', storeState.meats, server.meats, pendingIds(ops, 'meats'), writes),
    tastings: sortedTastings(
      mergePulled(
        'tastings',
        storeState.tastings,
        server.tastings,
        pendingIds(ops, 'tastings'),
        writes,
      ),
    ),
  };
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

  const cooks = storeState.cooks.map((cook) => {
    if (cook.meatId !== oldId) return cook;
    const moved = { ...cook, meatId: meat.id };
    writes.push({ store: 'cooks', put: moved });
    return moved;
  });
  storeState = {
    ...storeState,
    cooks: sorted(cooks),
    meats: [...storeState.meats.filter((m) => m.id !== oldId && m.id !== meat.id), meat],
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
