//////////////////////////////////////
// Formatting helpers

const localDateFormat = new Intl.DateTimeFormat('en-CA');
const dayFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

const pad = (n: number) => String(n).padStart(2, '0');

/** UTC ISO timestamp to the local calendar date, YYYY-MM-DD. */
export const localDate = (iso: string) => localDateFormat.format(new Date(iso));

/** "Nov 27, 2025" from a YYYY-MM-DD date or a full ISO timestamp (shown in local time). */
export const formatDay = (iso: string) =>
  dayFormat.format(new Date(iso.length === 10 ? `${iso}T00:00:00` : iso));

/** "2:15 PM" from epoch ms or an ISO timestamp. */
export const clockTime = (when: number | string) => timeFormat.format(new Date(when));

/** "11h 20m", or "45m" under an hour. */
export const formatDuration = (ms: number) => {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
};

/** "just now", "42 min ago", "2h 5m ago". */
export const timeAgo = (iso: string, now: number) => {
  const ms = now - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  return ms < 3_600_000 ? `${Math.round(ms / 60_000)} min ago` : `${formatDuration(ms)} ago`;
};

// datetime-local values are zone-less local wall-clock time at minute precision. Every
// conversion to and from stored UTC ISO timestamps goes through toLocalInput/fromLocalInput.

/** ISO timestamp to the value format of <input type="datetime-local"> (local time). */
export const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const fromLocalInput = (value: string) => new Date(value).toISOString();

/** A datetime-local value moved earlier by `minutes` (negative moves later). */
export const shiftLocalInput = (value: string, minutes: number) =>
  toLocalInput(
    new Date(new Date(fromLocalInput(value)).getTime() - minutes * 60_000).toISOString(),
  );
