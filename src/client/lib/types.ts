//////////////////////////////////////
// Client-only types

export type OutboxOp = {
  /** IndexedDB auto-increment key; defines send order. */
  seq: number;
  id: string;
  method: 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  createdAt: string;
};

export type NewOutboxOp = Pick<OutboxOp, 'method' | 'path' | 'body'>;

export type SyncState = {
  /** Outbox ops not yet accepted by the server. */
  pending: number;
  online: boolean;
  syncing: boolean;
  lastSynced: number | null;
};
