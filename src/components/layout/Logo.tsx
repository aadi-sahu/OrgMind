import { cn } from '@/lib/cn';

/** A small graph where one node stands out: the organization's model of itself. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn('size-5', className)} aria-hidden>
      <path d="M6 7.5 16 5.5M6 7.5 8.5 17.5M16 5.5 8.5 17.5M16 5.5 18 15.5M8.5 17.5 18 15.5" stroke="var(--ink-3)" strokeWidth="1.3" />
      <circle cx="6" cy="7.5" r="2.4" fill="var(--ink)" />
      <circle cx="16" cy="5.5" r="1.9" fill="var(--ink)" />
      <circle cx="8.5" cy="17.5" r="1.9" fill="var(--ink)" />
      <circle cx="18" cy="15.5" r="3" fill="var(--accent)" />
    </svg>
  );
}
