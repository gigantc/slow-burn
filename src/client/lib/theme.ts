//////////////////////////////////////
// Theme
// Saved choice wins, otherwise the system preference. The inline script in index.html
// applies the same choice before first paint; applyTheme also syncs <meta name="theme-color">.

import { useCallback, useState } from 'react';
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

export const initTheme = (): Theme => {
  const theme = readSaved() ?? systemTheme();
  applyTheme(theme);
  return theme;
};

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(initTheme);

  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    save(next);
    setTheme(next);
  }, [theme]);

  return { theme, toggle };
};
