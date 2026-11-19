//////////////////////////////////////
// Tasting categories
// Data, not code branches: add a category (Beer, Tea...) by adding a row here, plus a row in
// `$categories` (client/scss/_variables.scss) for its color. Nothing else needs to change.

export type TastingFieldDef = {
  key: string;
  label: string;
  /** `choice` is a single pick from `options` (whisky Type); the value is stored as that string. */
  kind: 'text' | 'number' | 'choice';
  /** Shown after a number, e.g. "yr", "%". */
  unit?: string;
  /** The allowed values of a `choice` field. Editing the list is a data change. */
  options?: readonly string[];
  placeholder?: string;
};

export type TastingCategoryDef = {
  key: string;
  /** Capitalized, for tags and the category switch. */
  label: string;
  /** Lowercase noun for sentences, e.g. "No whisky logged yet". */
  singular: string;
  /** Short facts about the thing (age, vintage...). */
  specFields: readonly TastingFieldDef[];
  /** Sensory notes (nose, palate...). */
  noteFields: readonly TastingFieldDef[];
  /** Label for the photo slot, once photos exist. */
  photoLabel: string;
};

export const tastingCategories = [
  {
    key: 'whisky',
    label: 'Whisky',
    singular: 'whisky',
    specFields: [
      {
        key: 'type',
        label: 'Type',
        kind: 'choice',
        options: [
          'Scotch',
          'Bourbon',
          'Rye',
          'Irish',
          'Japanese',
          'Canadian',
          'American',
          'World',
          'Other',
        ],
      },
      { key: 'age', label: 'Age', kind: 'number', unit: 'yr' },
      { key: 'abv', label: 'ABV', kind: 'number', unit: '%' },
      { key: 'region', label: 'Region', kind: 'text' },
    ],
    noteFields: [
      { key: 'nose', label: 'Nose', kind: 'text' },
      { key: 'palate', label: 'Palate', kind: 'text' },
      { key: 'finish', label: 'Finish', kind: 'text' },
    ],
    photoLabel: 'Add a photo of the bottle',
  },
  {
    key: 'cigar',
    label: 'Cigar',
    singular: 'cigar',
    specFields: [
      {
        key: 'strength',
        label: 'Strength',
        kind: 'choice',
        options: ['Mild', 'Mild-Medium', 'Medium', 'Medium-Full', 'Full'],
      },
      { key: 'vitola', label: 'Vitola', kind: 'text' },
      { key: 'wrapper', label: 'Wrapper', kind: 'text' },
      { key: 'smokeTime', label: 'Smoke time', kind: 'number', unit: 'min' },
    ],
    noteFields: [
      { key: 'draw', label: 'Draw', kind: 'text' },
      { key: 'flavor', label: 'Flavor', kind: 'text' },
      { key: 'finish', label: 'Finish', kind: 'text' },
    ],
    photoLabel: 'Add a photo of the band',
  },
  {
    key: 'wine',
    label: 'Wine',
    singular: 'wine',
    specFields: [
      {
        key: 'type',
        label: 'Type',
        kind: 'choice',
        options: ['Red', 'White', 'Rosé', 'Sparkling', 'Dessert'],
      },
      { key: 'vintage', label: 'Vintage', kind: 'number' },
      { key: 'varietal', label: 'Varietal', kind: 'text' },
      { key: 'region', label: 'Region', kind: 'text' },
    ],
    noteFields: [
      { key: 'nose', label: 'Nose', kind: 'text' },
      { key: 'palate', label: 'Palate', kind: 'text' },
      { key: 'finish', label: 'Finish', kind: 'text' },
    ],
    photoLabel: 'Add a photo of the label',
  },
] as const satisfies readonly TastingCategoryDef[];

export type TastingCategoryKey = (typeof tastingCategories)[number]['key'];

export const tastingCategoryKeys = tastingCategories.map((c) => c.key) as TastingCategoryKey[];

export const getTastingCategory = (key: TastingCategoryKey): TastingCategoryDef =>
  tastingCategories.find((c) => c.key === key) ?? tastingCategories[0];

/** Field values keyed by field key; text fields hold strings, number fields numbers. */
export type TastingDetails = Record<string, string | number>;

export const DETAIL_TEXT_MAX = 5000;
export const DETAIL_NUMBER_MAX = 1_000_000;

/**
 * Keep only the category's own fields: unknown keys and blank values are dropped, text is
 * trimmed, a choice that isn't one of its options is dropped. Returns undefined when a text or
 * number value has the wrong type for its field's kind.
 */
export const cleanDetails = (
  category: TastingCategoryKey,
  raw: Record<string, unknown>,
): TastingDetails | undefined => {
  const { specFields, noteFields } = getTastingCategory(category);
  const details: TastingDetails = {};

  for (const field of [...specFields, ...noteFields]) {
    const value = raw[field.key];
    if (value === undefined || value === null || value === '') continue;

    if (field.kind === 'choice') {
      // Not one of the options (a stale value after the list changed): left out, not an error
      if (typeof value === 'string' && field.options?.includes(value)) details[field.key] = value;
    } else if (field.kind === 'number') {
      if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
      if (Math.abs(value) > DETAIL_NUMBER_MAX) return undefined;
      details[field.key] = value;
    } else {
      if (typeof value !== 'string' || value.length > DETAIL_TEXT_MAX) return undefined;
      const text = value.trim();
      if (text) details[field.key] = text;
    }
  }
  return details;
};
