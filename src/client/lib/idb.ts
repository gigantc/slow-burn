//////////////////////////////////////
// IndexedDB
// A thin promise wrapper over the stores: `cooks` (events embedded), `meats`, `tastings`, `photos` (metadata only), `photoBlobs` (the JPEGs waiting to upload) and `outbox`.
// If IndexedDB is unavailable (some private modes), it falls back to memory for the session.

import { IDB_NAME, IDB_VERSION } from '@/config';

export type StoreName = 'cooks' | 'meats' | 'tastings' | 'photos' | 'photoBlobs' | 'outbox';

export type WriteOp = { store: StoreName; put: object } | { store: StoreName; delete: IDBValidKey };

//////////////////////////////////////
// Connection

let dbPromise: Promise<IDBDatabase | null> | null = null;

const openDb = () => {
  dbPromise ??= new Promise<IDBDatabase | null>((resolve) => {
    try {
      const request = indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('cooks'))
          db.createObjectStore('cooks', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('meats'))
          db.createObjectStore('meats', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('tastings'))
          db.createObjectStore('tastings', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('photos'))
          db.createObjectStore('photos', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('photoBlobs'))
          db.createObjectStore('photoBlobs', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('outbox')) {
          db.createObjectStore('outbox', { keyPath: 'seq', autoIncrement: true });
        }
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
  meats: new Map(),
  tastings: new Map(),
  photos: new Map(),
  photoBlobs: new Map(),
  outbox: new Map(),
};
let memorySeq = 1;

const keyOf = (store: StoreName, value: object): IDBValidKey => {
  if (store !== 'outbox') return (value as { id: string }).id;
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

export const dbGet = async <T>(store: StoreName, key: IDBValidKey): Promise<T | undefined> => {
  const db = await openDb();
  if (!db) return memory[store].get(key) as T | undefined;

  return new Promise((resolve, reject) => {
    const request = db.transaction(store).objectStore(store).get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
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
