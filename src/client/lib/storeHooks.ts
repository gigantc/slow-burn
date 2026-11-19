//////////////////////////////////////
// Store hooks shared by every kind of record

import { useSyncExternalStore } from 'react';
import { getStoreState, getSyncState, subscribe } from '@/lib/store';

export const useStoreState = () => useSyncExternalStore(subscribe, getStoreState);

export const useSyncStatus = () => useSyncExternalStore(subscribe, getSyncState);
