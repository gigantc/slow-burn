//////////////////////////////////////
// Client config

import type { IconName } from '@/components/Icon/Icon';

export const API_BASE = '/api';
export const APP_NAME = 'Slow Burn';

// Set after a successful login or session check, so a reload while offline stays signed in.
export const AUTH_HINT_KEY = 'slowburn-authed';

//////////////////////////////////////
// Offline data and sync

export const IDB_NAME = 'slowburn';
export const IDB_VERSION = 1;
export const UNDO_TOAST_MS = 8_000;
export const SYNC_INTERVAL_MS = 30_000;
export const SYNC_RETRY_BASE_MS = 2_000;
export const SYNC_RETRY_MAX_MS = 60_000;

// Also hard-coded in the inline script in index.html (it runs before the bundle loads).
export const THEME_STORAGE_KEY = 'slowburn-theme';

// User-facing theme names. Internal keys stay light/dark (data-theme, storage, prefers-color-scheme).
export const THEME_LABELS = {
  light: 'Dawn',
  dark: 'Dusk',
} as const satisfies Record<'light' | 'dark', string>;

// Cook screens that hide the sidebar nav on desktop and show a Close button (react-router patterns).
export const FOCUS_ROUTES = ['/cooks/new', '/cooks/:id', '/cooks/:id/edit', '/cooks/:id/wrap-up'];

export const NAV_ITEMS: readonly { label: string; path: string; icon: IconName }[] = [
  { label: 'Home', path: '/', icon: 'home' },
  { label: 'Cooks', path: '/cooks', icon: 'flame' },
  { label: 'Tastings', path: '/tastings', icon: 'glass' },
];

// Keep keys in sync with $entry-types in scss/_variables.scss.
export const ENTRY_TYPES = {
  cook: { label: 'Cook' },
  whisky: { label: 'Whisky' },
  cigar: { label: 'Cigar' },
  wine: { label: 'Wine' },
} as const;

export type EntryType = keyof typeof ENTRY_TYPES;
