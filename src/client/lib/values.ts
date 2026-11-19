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
