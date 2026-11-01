import { useState } from 'react';
import { CalendarDays, FileText, GitPullRequest, Inbox, Scale, Siren, UserCog, type LucideIcon } from 'lucide-react';
import { api, isDemoMode, type ActivityType } from '@/api';
import { EntityChip } from '@/components/domain/entity';
import { SampleTag } from '@/components/ui/Badge';
import { Select, type SelectOption } from '@/components/ui/Menu';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useOrgData } from '@/hooks/useOrgData';
import { useResource } from '@/hooks/useResource';
import { cn } from '@/lib/cn';
import { timeAgo } from '@/lib/format';

const TYPE_META: Record<ActivityType, { label: string; icon: LucideIcon }> = {
  code_change: { label: 'Code changes', icon: GitPullRequest },
  ownership_change: { label: 'Ownership', icon: UserCog },
  decision: { label: 'Decisions', icon: Scale },
  incident: { label: 'Incidents', icon: Siren },
  documentation: { label: 'Documentation', icon: FileText },
  meeting: { label: 'Meetings', icon: CalendarDays },
};

type Filter = ActivityType | 'all';

export function ActivityPanel({ className }: { className?: string }) {
  const { data, error, loading, refetch } = useResource((signal) => api.listActivity(signal));
  const { node } = useOrgData();
  const [filter, setFilter] = useState<Filter>('all');

  const options: SelectOption<Filter>[] = [
    { value: 'all', label: 'All activity', count: data?.length },
    ...(Object.keys(TYPE_META) as ActivityType[]).map((type) => ({
      value: type,
      label: TYPE_META[type].label,
      count: data?.filter((event) => event.type === type).length,
    })),
  ];

  const rows = (data ?? []).filter((event) => filter === 'all' || event.type === filter);

  return (
    <Panel className={cn('flex min-h-0 flex-col', className)} aria-label="Recent activity">
      <PanelHeader
        title={
          <span className="flex items-center gap-2">
            Recent activity
            {isDemoMode && <SampleTag />}
          </span>
        }
        description="Events turned into structured knowledge by extraction agents"
        actions={<Select label="Filter activity" value={filter} onChange={setFilter} options={options} align="end" />}
      />
      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : loading ? (
        <div className="space-y-4 border-t border-line p-4">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={<Inbox className="size-4" aria-hidden />} title="No activity of this type" description="Choose a different filter to see more." />
      ) : (
        <ol className="max-h-[520px] min-h-0 flex-1 overflow-y-auto border-t border-line lg:max-h-none">
          {rows.map((event) => {
            const Icon = TYPE_META[event.type].icon;
            const actor = node(event.actorId)?.name;
            return (
              <li key={event.id} className="flex gap-3 border-b border-line px-4 py-3 last:border-b-0">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-line bg-surface-2">
                  <Icon className="size-3.5 text-ink-3" aria-label={TYPE_META[event.type].label} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="min-w-0 text-ui font-medium text-ink">{event.title}</p>
                    <time dateTime={event.occurredAt} className="tabular shrink-0 text-meta text-ink-3">
                      {timeAgo(event.occurredAt)}
                    </time>
                  </div>
                  <p className="mt-0.5 text-ui text-ink-2">{event.detail}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-3">
                    <span>
                      {event.source}
                      {actor ? ` · ${actor}` : ''} · {event.extractedBy} · {event.graphUpdates} graph {event.graphUpdates === 1 ? 'update' : 'updates'}
                    </span>
                    <span className="flex flex-wrap gap-1">
                      {event.entityIds.slice(0, 3).map((id) => (
                        <EntityChip key={id} id={id} />
                      ))}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
