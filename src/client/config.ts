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
export const IDB_VERSION = 2;
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

// Form screens (react-router patterns). On phone they swap the tab bar for a sticky action bar.
export const FORM_ROUTES: readonly string[] = [
  '/cooks/new',
  '/cooks/:id/edit',
  '/cooks/:id/wrap-up',
];

// Screens that get the phone sky as their page background (react-router patterns).
export const SKY_ROUTES: readonly string[] = ['/'];

// Time-of-day line on Home ("Thursday evening"). Each period starts at `from` (local hour) and
// runs until the next one starts; hours before the first `from` belong to the last period.
export const GREETING_PERIODS: readonly { name: string; from: number }[] = [
  { name: 'morning', from: 5 },
  { name: 'afternoon', from: 12 },
  { name: 'evening', from: 17 },
  { name: 'night', from: 21 },
];

// Entries shown in Home's "Lately" (desktop grid; the phone list trims it in CSS).
export const LATELY_COUNT = 6;

// Staple-meat chips under the meat picker (the selected meat is not repeated).
export const MEAT_CHIP_COUNT = 4;

// Past cooks of the chosen meat listed beside the New cook form.
export const PAST_COOKS_COUNT = 5;

// Phone layout switches at this width; keep in sync with $bp-md in scss/_variables.scss.
export const BP_MD = 768;

export const NAV_ITEMS: readonly { label: string; path: string; icon: IconName }[] = [
  { label: 'Home', path: '/', icon: 'home' },
  { label: 'Cooks', path: '/cooks', icon: 'flame' },
  { label: 'Tastings', path: '/tastings', icon: 'glass' },
];

// Keep keys in sync with $categories in scss/_variables.scss.
export const ENTRY_TYPES = {
  cook: { label: 'Cook' },
  whisky: { label: 'Whisky' },
  cigar: { label: 'Cigar' },
  wine: { label: 'Wine' },
} as const;

export type EntryType = keyof typeof ENTRY_TYPES;
