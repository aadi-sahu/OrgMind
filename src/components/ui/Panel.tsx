import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Panel({ className, children, ...rest }: HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn('rounded-lg border border-line bg-surface', className)} {...rest}>
      {children}
    </section>
  );
}

interface PanelHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PanelHeader({ title, description, actions, className }: PanelHeaderProps) {
  return (
    <header className={cn('flex flex-wrap items-start justify-between gap-x-3 gap-y-2 px-4 pt-3.5 pb-3', className)}>
      <div className="min-w-0">
        <h2 className="text-ui font-medium text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-meta text-ink-3">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </header>
  );
}

/** Page-level title row. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-h1 font-semibold tracking-[-0.01em] text-ink">{title}</h1>
        {description && <p className="mt-0.5 max-w-2xl text-ui text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Standard page gutter and width. */
export function PageContainer({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-[1440px] px-4 py-5 md:px-6 md:py-6', className)}>{children}</div>;
}
