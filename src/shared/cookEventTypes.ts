//////////////////////////////////////
// Cook event types
// Data, not code branches: add a type by adding a row here.

export type CookEventTypeDef = {
  key: string;
  label: string;
  /** Present when the event carries a numeric value (e.g. a temperature). */
  value?: { unit: string };
};

export const cookEventTypes = [
  { key: 'on_pit', label: 'On the pit' },
  { key: 'pit_temp', label: 'Pit temp', value: { unit: '°F' } },
  { key: 'internal_temp', label: 'Internal temp', value: { unit: '°F' } },
  { key: 'spritz', label: 'Spritz' },
  { key: 'wrap', label: 'Wrap' },
  { key: 'add_wood', label: 'Add wood' },
  { key: 'off_pit', label: 'Off the pit' },
  { key: 'rest', label: 'Rest' },
  { key: 'note', label: 'Note' },
] as const satisfies readonly CookEventTypeDef[];

export type CookEventTypeKey = (typeof cookEventTypes)[number]['key'];

export const cookEventTypeKeys = cookEventTypes.map((t) => t.key) as CookEventTypeKey[];
