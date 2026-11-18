//////////////////////////////////////
// IndexedDB
// A thin promise wrapper over two stores: `cooks` (events embedded) and `outbox`.
// If IndexedDB is unavailable (some private modes), it falls back to memory for the session.

import { IDB_NAME, IDB_VERSION } from '@/config';

export type StoreName = 'cooks' | 'outbox';

export type WriteOp = { store: StoreName; put: object } | { store: StoreName; delete: IDBValidKey };

//////////////////////////////////////
// Connection

let dbPromise: Promise<IDBDatabase | null> | null = null;

const openDb = () => {
  dbPromise ??= new Promise<IDBDatabase | null>((resolve) => {
    try {
      const request = indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('cooks', { keyPath: 'id' });
        request.result.createObjectStore('outbox', { keyPath: 'seq', autoIncrement: true });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  }).then((db) => {
    if (!db) console.warn('IndexedDB unavailable; data will not survive a reload.');
    return db;
  });
  return dbPromise;
};

//////////////////////////////////////
// Memory fallback

const memory: Record<StoreName, Map<IDBValidKey, object>> = {
  cooks: new Map(),
  outbox: new Map(),
};
let memorySeq = 1;

const keyOf = (store: StoreName, value: object): IDBValidKey => {
  if (store === 'cooks') return (value as { id: string }).id;
  const op = value as { seq?: number };
  op.seq ??= memorySeq++;
  return op.seq;
};

//////////////////////////////////////
// API

export const dbGetAll = async <T>(store: StoreName): Promise<T[]> => {
  const db = await openDb();
  if (!db) return [...memory[store].values()] as T[];

  return new Promise((resolve, reject) => {
    const request = db.transaction(store).objectStore(store).getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
};

export const dbWrite = async (ops: WriteOp[]): Promise<void> => {
  if (ops.length === 0) return;
  const db = await openDb();

  if (!db) {
    for (const op of ops) {
      if ('put' in op) memory[op.store].set(keyOf(op.store, op.put), op.put);
      else memory[op.store].delete(op.delete);
    }
    return;
  }

  return new Promise((resolve, reject) => {
    const stores = [...new Set(ops.map((op) => op.store))];
    const tx = db.transaction(stores, 'readwrite');
    for (const op of ops) {
      const store = tx.objectStore(op.store);
      if ('put' in op) store.put(op.put);
      else store.delete(op.delete);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
};
