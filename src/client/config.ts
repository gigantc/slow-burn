//////////////////////////////////////
// Client config

import type { IconName } from '@/components/Icon/Icon';

export const API_BASE = '/api';
export const APP_NAME = 'Slow Burn';

// Also hard-coded in the inline script in index.html (it runs before the bundle loads).
export const THEME_STORAGE_KEY = 'slowburn-theme';

// User-facing theme names. Internal keys stay light/dark (data-theme, storage, prefers-color-scheme).
export const THEME_LABELS = {
  light: 'Dawn',
  dark: 'Dusk',
} as const satisfies Record<'light' | 'dark', string>;

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
