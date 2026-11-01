import { Link } from 'react-router-dom';
import type { EntityType, OrgCounts } from '@/api';
import { EntityGlyph } from '@/components/domain/entity';
import { Skeleton } from '@/components/ui/States';
import { cn } from '@/lib/cn';
import { ENTITY_META, explorerPath } from '@/lib/entities';
import { plural } from '@/lib/format';

interface Tile {
  type: EntityType;
  value: number;
  context: string;
}

function tiles(counts: OrgCounts): Tile[] {
  return [
    { type: 'team', value: counts.teams, context: `${plural(counts.people, 'person', 'people')} across them` },
    { type: 'project', value: counts.projects, context: `${counts.projectsNeedingAttention} need attention` },
    { type: 'repository', value: counts.repositories, context: `${counts.repositoriesAtRisk} with a bus factor of 1` },
    { type: 'service', value: counts.services, context: `${counts.servicesNeedingAttention} not healthy` },
    { type: 'person', value: counts.people, context: 'Mapped to teams and code' },
    { type: 'decision', value: counts.decisions, context: `${counts.decisionsProposed} awaiting a decision` },
  ];
}

export function CountsGrid({ counts, className }: { counts?: OrgCounts; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3', className)}>
      {counts
        ? tiles(counts).map((tile) => (
            <Link
              key={tile.type}
              to={explorerPath(tile.type)}
              className="flex flex-col bg-surface px-4 py-3 transition-colors duration-100 hover:bg-surface-2 focus-visible:-outline-offset-2"
            >
              <span className="flex items-center gap-2 text-ui text-ink-2">
                <EntityGlyph type={tile.type} />
                {ENTITY_META[tile.type].plural}
              </span>
              <span className="mt-1 block text-stat font-semibold tracking-[-0.02em] text-ink">{tile.value}</span>
              <span className="block text-meta text-ink-3">{tile.context}</span>
            </Link>
          ))
        : Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="bg-surface px-4 py-3">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="mt-1 h-8 w-10" />
              <Skeleton className="mt-1 h-4 w-28" />
            </div>
          ))}
    </div>
  );
}
