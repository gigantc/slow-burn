//////////////////////////////////////
// Value helpers shared by cooks and tastings

/** Distinct non-blank values in order (pass most recent first), case-insensitive, first casing wins. */
export const distinctValues = (values: readonly (string | null | undefined)[]) => {
  const seen = new Map<string, string>();
  for (const raw of values) {
    const value = raw?.trim();
    if (value && !seen.has(value.toLowerCase())) seen.set(value.toLowerCase(), value);
  }
  return [...seen.values()];
};

/**
 * Suggestions for a field: values used before (most used first, case-insensitive; an option's own
 * casing wins) on top, then the remaining options in their order.
 */
export const rankValues = (used: readonly string[], options: readonly string[]) => {
  const optionByKey = new Map(options.map((option) => [option.toLowerCase(), option]));
  const counts = new Map<string, { text: string; count: number }>();
  for (const raw of used) {
    const text = raw.trim();
    const key = text.toLowerCase();
    if (!text) continue;
    const entry = counts.get(key);
    if (entry) entry.count++;
    else counts.set(key, { text: optionByKey.get(key) ?? text, count: 1 });
  }
  // sort is stable: ties keep the order first seen
  const top = [...counts.values()].sort((a, b) => b.count - a.count).map((entry) => entry.text);
  return [...top, ...options.filter((option) => !counts.has(option.toLowerCase()))];
};
