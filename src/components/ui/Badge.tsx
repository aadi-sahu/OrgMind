import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Badge({ children, icon, className }: { children: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 max-w-full items-center gap-1 rounded border border-line bg-surface-2 px-1.5 text-micro font-medium whitespace-nowrap text-ink-2',
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Small tag for "this is sample data". Consistent wording matters more than prominence. */
export function SampleTag({ className }: { className?: string }) {
  return (
    <span
      title="Sample data for demonstration. Not from a real organization."
      className={cn(
        'inline-flex h-4.5 items-center rounded border border-line-strong px-1 text-[10px] font-medium tracking-wide text-ink-3 uppercase',
        className,
      )}
    >
      Sample
    </span>
  );
}
