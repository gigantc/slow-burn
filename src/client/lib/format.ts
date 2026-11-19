//////////////////////////////////////
// Formatting helpers

import { GREETING_PERIODS } from '@/config';

const localDateFormat = new Intl.DateTimeFormat('en-CA');
const dayFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
const weekdayFormat = new Intl.DateTimeFormat('en-US', { weekday: 'long' });
const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

const pad = (n: number) => String(n).padStart(2, '0');

/** UTC ISO timestamp to the local calendar date, YYYY-MM-DD. */
export const localDate = (iso: string) => localDateFormat.format(new Date(iso));

/** "Nov 27, 2025" from a YYYY-MM-DD date or a full ISO timestamp (shown in local time). */
export const formatDay = (iso: string) =>
  dayFormat.format(new Date(iso.length === 10 ? `${iso}T00:00:00` : iso));

const dayShortFormat = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

/** "Sat, Nov 21" from a YYYY-MM-DD date or an ISO timestamp (local time); adds the year if not this year. */
export const formatDayShort = (iso: string) => {
  const date = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  const base = dayShortFormat.format(date);
  return date.getFullYear() === new Date().getFullYear() ? base : `${base}, ${date.getFullYear()}`;
};

const monthDayFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

/** "Nov 8" from a YYYY-MM-DD date or an ISO timestamp (local time); adds the year if not this year. */
export const formatMonthDay = (iso: string) => {
  const date = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  const base = monthDayFormat.format(date);
  return date.getFullYear() === new Date().getFullYear() ? base : `${base}, ${date.getFullYear()}`;
};

/** "Thursday evening": the weekday plus the part of the day from GREETING_PERIODS. */
export const greeting = (date: Date) => {
  const hour = date.getHours();
  const periods = [...GREETING_PERIODS].sort((a, b) => a.from - b.from);
  const period = periods.findLast((p) => hour >= p.from) ?? periods[periods.length - 1];
  return `${weekdayFormat.format(date)} ${period?.name ?? ''}`.trim();
};

/** "2:15 PM" from epoch ms or an ISO timestamp. */
export const clockTime = (when: number | string) => timeFormat.format(new Date(when));

/** "11h 20m", or "45m" under an hour. */
export const formatDuration = (ms: number) => {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
};

/** "6:12": elapsed hours and minutes as a clock. */
export const formatClock = (ms: number) => {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  return `${Math.floor(minutes / 60)}:${pad(minutes % 60)}`;
};

/** "7:00 AM" for today, otherwise "Nov 27, 2025, 7:00 AM". */
export const formatWhen = (iso: string, now = Date.now()) =>
  localDate(iso) === localDate(new Date(now).toISOString())
    ? clockTime(iso)
    : `${formatDay(iso)}, ${clockTime(iso)}`;

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
