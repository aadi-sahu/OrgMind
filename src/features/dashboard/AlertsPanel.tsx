import { Link } from 'react-router-dom';
import { CheckCheck } from 'lucide-react';
import type { Severity } from '@/api';
import { SEVERITY_META } from '@/components/domain/status';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useInsights } from '@/hooks/useInsights';
import { cn } from '@/lib/cn';
import { timeAgo } from '@/lib/format';

const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low'];
const MAX_ROWS = 10;

export function AlertsPanel({ className }: { className?: string }) {
  const { insights, alerts, loading, error, retry } = useInsights();

  const openBySeverity = SEVERITIES.map((severity) => ({
    severity,
    count: (insights ?? []).filter((i) => i.status === 'open' && i.severity === severity).length,
  }));

  return (
    <Panel className={cn('flex flex-col', className)} aria-label="Risks and alerts">
      <PanelHeader
        title="Risks and alerts"
        description="Open findings that need a response"
        actions={
          <Link to="/intelligence" className="text-meta text-ink-2 hover:text-ink hover:underline">
            View all
          </Link>
        }
      />
      {error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : loading ? (
        <div className="space-y-3 border-t border-line p-4">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 border-y border-line">
            {openBySeverity.map(({ severity, count }) => {
              const meta = SEVERITY_META[severity];
              const Icon = meta.icon;
              return (
                <Link
                  key={severity}
                  to={`/intelligence?severity=${severity}`}
                  aria-label={`${count} open ${meta.label.toLowerCase()} findings`}
                  className="border-r border-line px-3 py-2.5 transition-colors duration-100 last:border-r-0 hover:bg-surface-2 focus-visible:-outline-offset-2"
                >
                  <span className="block text-title font-semibold text-ink">{count}</span>
                  <span className="flex items-center gap-1 text-meta text-ink-3">
                    <Icon className={cn('size-3 shrink-0', meta.color)} aria-hidden />
                    <span className="truncate">{meta.label}</span>
                  </span>
                </Link>
              );
            })}
          </div>
          {alerts.length === 0 ? (
            <EmptyState
              icon={<CheckCheck className="size-4 text-good" aria-hidden />}
              title="No urgent findings"
              description="Critical and high-severity findings will appear here."
            />
          ) : (
            <ul className="flex-1">
              {alerts.slice(0, MAX_ROWS).map((alert) => {
                const meta = SEVERITY_META[alert.severity];
                const Icon = meta.icon;
                return (
                  <li key={alert.id} className="border-b border-line last:border-b-0">
                    <Link
                      to={`/intelligence?finding=${alert.id}`}
                      className="flex gap-2.5 px-4 py-2.5 transition-colors duration-100 hover:bg-surface-2 focus-visible:-outline-offset-2"
                    >
                      <Icon className={cn('mt-0.5 size-3.5 shrink-0', meta.color)} aria-label={meta.label} />
                      <span className="min-w-0 flex-1 text-ui text-ink">{alert.title}</span>
                      <span className="tabular shrink-0 text-meta text-ink-3">{timeAgo(alert.detectedAt)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </Panel>
  );
}
