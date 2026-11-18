//////////////////////////////////////
// Meat names

/**
 * Normalized key for matching meat names: lowercase, accents removed, everything that isn't a
 * letter or digit dropped. "Pulled Pork", "pulled  pork" and "pulledpork" share one key.
 * The same rule is used by the server (unique name_key) and the client (picker, dedupe).
 */
export const meatKey = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
