/** Sample dates are relative to page load so the demo never looks stale. */
const NOW = Date.now();

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const minutesAgo = (n: number) => new Date(NOW - n * MINUTE).toISOString();
export const hoursAgo = (n: number) => new Date(NOW - n * HOUR).toISOString();
export const daysAgo = (n: number) => new Date(NOW - n * DAY).toISOString();
export const daysFromNow = (n: number) => new Date(NOW + n * DAY).toISOString();

/** "12 Oct"-style label for the start of a week `weeksBack` weeks ago. */
export function weekLabel(weeksBack: number): string {
  return new Date(NOW - weeksBack * 7 * DAY).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
