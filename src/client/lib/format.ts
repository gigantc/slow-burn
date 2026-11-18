//////////////////////////////////////
// Formatting helpers

const localDateFormat = new Intl.DateTimeFormat('en-CA');
const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

/** UTC ISO timestamp to the local calendar date, YYYY-MM-DD. */
export const localDate = (iso: string) => localDateFormat.format(new Date(iso));

export const clockTime = (ms: number) => timeFormat.format(new Date(ms));
