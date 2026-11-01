import { Link } from 'react-router-dom';
import type { GraphStats } from '@/api';
import { EntityGlyph, EntityLink } from '@/components/domain/entity';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { Skeleton } from '@/components/ui/States';
import { cn } from '@/lib/cn';
import { entityColor, ENTITY_META, ENTITY_TYPES } from '@/lib/entities';

const TOP_CONNECTED = 4;

export function GraphStatsPanel({ graph, className }: { graph?: GraphStats; className?: string }) {
  return (
    <Panel className={cn('flex flex-col', className)} aria-label="Knowledge graph statistics">
      <PanelHeader
        title="Knowledge graph"
        description="The current model of the organization"
        actions={
          <Link to="/graph" className="text-meta text-ink-2 hover:text-ink hover:underline">
            Open graph
          </Link>
        }
      />
      {!graph ? (
        <div className="space-y-3 px-4 pb-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <div className="grid flex-1 gap-x-8 gap-y-4 px-4 pb-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,220px)]">
          <div>
            <dl className="flex gap-8">
              <div>
                <dd className="text-stat font-semibold tracking-[-0.02em] text-ink">{graph.nodes}</dd>
                <dt className="text-meta text-ink-3">Entities, +{graph.nodesAddedThisWeek} this week</dt>
              </div>
              <div>
                <dd className="text-stat font-semibold tracking-[-0.02em] text-ink">{graph.edges}</dd>
                <dt className="text-meta text-ink-3">Relationships, +{graph.edgesAddedThisWeek} this week</dt>
              </div>
            </dl>

            {/* Thin segmented bar: one whole, with the figures in the list directly below it. */}
            <div
              className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full"
              role="img"
              aria-label={`Entities by type: ${ENTITY_TYPES.map((t) => `${ENTITY_META[t].plural} ${graph.nodesByType[t]}`).join(', ')}`}
            >
              {ENTITY_TYPES.map((type) => (
                <span
                  key={type}
                  title={`${ENTITY_META[type].plural}: ${graph.nodesByType[type]}`}
                  style={{ flexGrow: graph.nodesByType[type], background: entityColor(type) }}
                />
              ))}
            </div>
            <ul className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1 xl:grid-cols-3">
              {ENTITY_TYPES.map((type) => (
                <li key={type} className="flex min-w-0 items-center gap-1.5 text-meta text-ink-2">
                  <EntityGlyph type={type} />
                  <span className="truncate">{ENTITY_META[type].plural}</span>
                  <span className="tabular ml-auto text-ink">{graph.nodesByType[type]}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <p className="mb-1 text-meta font-medium text-ink-2">Most connected</p>
            <ol className="space-y-0.5">
              {graph.mostConnected.slice(0, TOP_CONNECTED).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 text-ui">
                  <EntityLink id={item.id} className="text-ink-2" />
                  <span className="tabular shrink-0 text-meta text-ink-3">{item.connections}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </Panel>
  );
}
