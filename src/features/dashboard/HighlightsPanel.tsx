import { Link } from 'react-router-dom';
import { ArrowRight, Lightbulb, TrendingUp, TriangleAlert } from 'lucide-react';
import type { Highlight } from '@/api';
import { isDemoMode } from '@/api';
import { EntityChip } from '@/components/domain/entity';
import { SampleTag } from '@/components/ui/Badge';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { EmptyState, Skeleton } from '@/components/ui/States';
import { cn } from '@/lib/cn';
import { assistantPath } from '@/lib/entities';

const TONE = {
  risk: { icon: TriangleAlert, color: 'text-serious', label: 'Risk' },
  neutral: { icon: Lightbulb, color: 'text-warning', label: 'Opportunity' },
  positive: { icon: TrendingUp, color: 'text-good', label: 'Improvement' },
} as const;

export function HighlightsPanel({ highlights, className }: { highlights?: Highlight[]; className?: string }) {
  return (
    <Panel className={className} aria-label="AI insights">
      <PanelHeader
        title={
          <span className="flex items-center gap-2">
            AI insights
            {isDemoMode && <SampleTag />}
          </span>
        }
        description="What changed in the organization, and why it matters"
      />
      {highlights?.length === 0 ? (
        <EmptyState
          icon={<Lightbulb className="size-4" aria-hidden />}
          title="No insights yet"
          description="They appear here once a connected data source has synced."
        />
      ) : highlights ? (
        <ul>
          {highlights.map((highlight) => {
            const tone = TONE[highlight.tone];
            const Icon = tone.icon;
            return (
              <li key={highlight.id} className="flex gap-3 border-t border-line px-4 py-3.5">
                <Icon className={cn('mt-0.5 size-4 shrink-0', tone.color)} aria-label={tone.label} />
                <div className="min-w-0 flex-1">
                  <p className="text-ui font-medium text-ink">{highlight.title}</p>
                  <p className="mt-0.5 text-ui text-ink-2">{highlight.body}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {highlight.question && (
                      <Link
                        to={assistantPath(highlight.question)}
                        className="mr-1 inline-flex h-6 items-center gap-1 rounded text-meta font-medium text-accent hover:underline"
                      >
                        Investigate
                        <ArrowRight className="size-3" aria-hidden />
                      </Link>
                    )}
                    {highlight.entityIds.map((id) => (
                      <EntityChip key={id} id={id} />
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="space-y-4 border-t border-line p-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-2 h-3.5 w-full" />
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
