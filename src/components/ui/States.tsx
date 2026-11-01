import type { ReactNode } from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

export function Skeleton({ className }: { className?: string }) {
  // A span, so that it can stand in for text inside headings and paragraphs.
  return <span className={cn('skeleton block', className)} aria-hidden />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      {icon && (
        <div className="mb-3 flex size-9 items-center justify-center rounded-lg border border-line bg-surface-2 text-ink-3">
          {icon}
        </div>
      )}
      <p className="text-ui font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-meta text-ink-3">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const message = error instanceof Error ? error.message : 'Something went wrong.';
  return (
    <div role="alert" className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <div className="mb-3 flex size-9 items-center justify-center rounded-lg border border-line bg-surface-2">
        <AlertCircle className="size-4 text-critical" aria-hidden />
      </div>
      <p className="text-ui font-medium text-ink">Could not load this data</p>
      <p className="mt-1 max-w-sm text-meta text-ink-3">{message}</p>
      {onRetry && (
        <Button size="sm" className="mt-3" onClick={onRetry} icon={<RotateCw className="size-3.5" aria-hidden />}>
          Try again
        </Button>
      )}
    </div>
  );
}
