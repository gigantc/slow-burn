//////////////////////////////////////
// Theme
// Saved choice wins, otherwise the system preference. The inline script in index.html
// applies the same choice before first paint; applyTheme also syncs <meta name="theme-color">.

import { useSyncExternalStore } from 'react';
import { THEME_STORAGE_KEY } from '@/config';

export type Theme = 'light' | 'dark';

const isTheme = (value: unknown): value is Theme => value === 'light' || value === 'dark';

const readSaved = (): Theme | null => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(saved) ? saved : null;
  } catch {
    return null;
  }
};

const save = (theme: Theme) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private mode or blocked storage: the choice just won't persist.
  }
};

const systemTheme = (): Theme =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  root.dataset.theme = theme;
  const chrome = getComputedStyle(root).getPropertyValue('--chrome').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', chrome);
};

const listeners = new Set<() => void>();
let current: Theme | null = null;

export const initTheme = (): Theme => {
  current = readSaved() ?? systemTheme();
  applyTheme(current);
  return current;
};

const getTheme = () => current ?? initTheme();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const setTheme = (next: Theme) => {
  if (next === getTheme()) return;
  current = next;
  applyTheme(next);
  save(next);
  listeners.forEach((listener) => listener());
};

/** One shared state: the sidebar's and the phone menu's toggles always agree. */
export const useTheme = () => ({
  theme: useSyncExternalStore(subscribe, getTheme),
  setTheme,
  toggle: () => setTheme(getTheme() === 'dark' ? 'light' : 'dark'),
});
