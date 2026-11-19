import { useLayoutEffect } from 'react';

/**
 * Recolors the screen (and the sidebar) with a category's accent while it is mounted: sets
 * data-category on <html>, which _themes.scss turns into --cat, --cat-soft and --cat-on. It is on
 * <html> rather than the screen root so the sidebar and breadcrumb pick it up too.
 */
export const useCategoryAccent = (category: string | undefined) => {
  useLayoutEffect(() => {
    if (!category) return;
    const root = document.documentElement;
    root.dataset.category = category;
    return () => {
      delete root.dataset.category;
    };
  }, [category]);
};
