//////////////////////////////////////
// Sync engine
// Sends the outbox in order, then pulls the server's cooks into the cache. Triggered on
// start, mutations, `online`, tab focus, and an interval. Retries back off on network/5xx.

import { SYNC_INTERVAL_MS, SYNC_RETRY_BASE_MS, SYNC_RETRY_MAX_MS } from '@/config';
import {
  applyPull,
  countPending,
  getMutationVersion,
  loadStore,
  pendingCookIds,
  setSyncState,
} from '@/lib/cookStore';
import { dbGetAll, dbWrite } from '@/lib/idb';
import { classify, pullAll, sendOp } from '@/lib/transport';
import type { OutboxOp } from '@/lib/types';

type Result = 'ok' | 'retry' | 'auth';

let started = false;
let paused = false;
let running = false;
let rerun = false;
let retryDelay = 0;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let intervalTimer: ReturnType<typeof setInterval> | undefined;

const authLostListeners = new Set<() => void>();

export const onAuthLost = (listener: () => void) => {
  authLostListeners.add(listener);
  return () => {
    authLostListeners.delete(listener);
  };
};

const readOutbox = async () => (await dbGetAll<OutboxOp>('outbox')).sort((a, b) => a.seq - b.seq);

//////////////////////////////////////
// Steps

const drain = async (): Promise<Result> => {
  for (;;) {
    const [op] = await readOutbox();
    if (!op) return 'ok';

    const outcome = await sendOp(op);
    if (outcome === 'auth') return 'auth';
    if (outcome === 'retry') return 'retry';

    // Accepted or permanently rejected (already logged): either way it leaves the outbox.
    await dbWrite([{ store: 'outbox', delete: op.seq }]);
    await countPending();
  }
};

const pull = async (): Promise<Result> => {
  const readVersion = getMutationVersion();
  try {
    const { cooks } = await pullAll();
    applyPull(cooks, pendingCookIds(await readOutbox()), readVersion);
    return 'ok';
  } catch (err) {
    return classify(err) === 'auth' ? 'auth' : 'retry';
  }
};

const scheduleRetry = () => {
  retryDelay = Math.min(SYNC_RETRY_MAX_MS, retryDelay ? retryDelay * 2 : SYNC_RETRY_BASE_MS);
  clearTimeout(retryTimer);
  retryTimer = setTimeout(() => void flush(), retryDelay);
};

//////////////////////////////////////
// Flush

const flush = async () => {
  if (!started || paused) return;
  if (running) {
    rerun = true;
    return;
  }
  if (!navigator.onLine) return;

  running = true;
  setSyncState({ syncing: true });

  let result: Result = 'retry';
  try {
    result = await drain();
    if (result === 'ok') result = await pull();
  } catch (err) {
    console.error('Sync failed', err);
  } finally {
    running = false;
    setSyncState({ syncing: false });
  }

  if (result === 'ok') {
    retryDelay = 0;
    clearTimeout(retryTimer);
    setSyncState({ lastSynced: Date.now() });
  } else if (result === 'retry') {
    scheduleRetry();
  } else {
    // Session expired: stop until the user signs in again. The outbox stays intact.
    paused = true;
    authLostListeners.forEach((listener) => listener());
  }

  if (rerun) {
    rerun = false;
    void flush();
  }
};

export const requestSync = () => void flush();

//////////////////////////////////////
// Lifecycle

const onOnline = () => {
  setSyncState({ online: true });
  requestSync();
};
const onOffline = () => setSyncState({ online: false });
const onVisible = () => {
  if (document.visibilityState === 'visible') requestSync();
};

export const startSync = async () => {
  if (started) return;
  started = true;
  paused = false;
  setSyncState({ online: navigator.onLine });

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  window.addEventListener('focus', requestSync);
  document.addEventListener('visibilitychange', onVisible);
  intervalTimer = setInterval(requestSync, SYNC_INTERVAL_MS);

  await loadStore();
  requestSync();
};

export const stopSync = () => {
  started = false;
  window.removeEventListener('online', onOnline);
  window.removeEventListener('offline', onOffline);
  window.removeEventListener('focus', requestSync);
  document.removeEventListener('visibilitychange', onVisible);
  clearInterval(intervalTimer);
  clearTimeout(retryTimer);
};
