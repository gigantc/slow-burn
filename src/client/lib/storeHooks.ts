//////////////////////////////////////
// Store hooks shared by every kind of record

import { useSyncExternalStore } from 'react';
import { getNotice, getStoreState, getSyncState, subscribe } from '@/lib/store';

export const useStoreState = () => useSyncExternalStore(subscribe, getStoreState);

export const useSyncStatus = () => useSyncExternalStore(subscribe, getSyncState);

/** A message no screen owns (a photo that couldn't upload), shown by the shell. */
export const useNotice = () => useSyncExternalStore(subscribe, getNotice);
