const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "4m ago", "3h ago", "12d ago"; also handles future dates ("in 14d"). */
export function timeAgo(iso: string, now = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  const abs = Math.abs(diff);
  const label =
    abs < MINUTE
      ? null
      : abs < HOUR
        ? `${Math.round(abs / MINUTE)}m`
        : abs < DAY
          ? `${Math.round(abs / HOUR)}h`
          : abs < 365 * DAY
            ? `${Math.round(abs / DAY)}d`
            : `${(abs / (365 * DAY)).toFixed(1)}y`;
  if (!label) return 'just now';
  return diff >= 0 ? `${label} ago` : `in ${label}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function signed(value: number, digits = 0): string {
  const rounded = value.toFixed(digits);
  return value > 0 ? `+${rounded}` : rounded.replace('-', '−');
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '')).toUpperCase();
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}
