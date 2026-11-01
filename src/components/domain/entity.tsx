import { Link } from 'react-router-dom';
import type { EntityType } from '@/api';
import { useOrgData } from '@/hooks/useOrgData';
import { cn } from '@/lib/cn';
import { entityColor, ENTITY_META, explorerPath, type NodeShape } from '@/lib/entities';
import { initials } from '@/lib/format';

/** Small SVG glyph matching the shape a node type has on the graph. */
export function EntityGlyph({ type, className }: { type: EntityType; className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={cn('size-2.5 shrink-0', className)} style={{ fill: entityColor(type) }} aria-hidden>
      <ShapePath shape={ENTITY_META[type].shape} />
    </svg>
  );
}

function ShapePath({ shape }: { shape: NodeShape }) {
  switch (shape) {
    case 'circle':
      return <circle cx="6" cy="6" r="5.5" />;
    case 'square':
      return <rect x="1" y="1" width="10" height="10" rx="1.5" />;
    case 'diamond':
      return <path d="M6 0 12 6 6 12 0 6Z" />;
    case 'triangle':
      return <path d="M6 .8 11.8 11H.2Z" />;
    case 'hexagon':
      return <path d="M6 0 11.2 3v6L6 12 .8 9V3Z" />;
    case 'star':
      return <path d="M6 0 7.8 4.2 12 6 7.8 7.8 6 12 4.2 7.8 0 6 4.2 4.2Z" />;
  }
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface-3 text-[10px] font-medium text-ink-2',
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

interface EntityLinkProps {
  id: string;
  /** Show the type glyph. */
  glyph?: boolean;
  className?: string;
  onNavigate?: () => void;
}

/** A name that links to its detail view. Used anywhere an id appears in the UI. */
export function EntityLink({ id, glyph = true, className, onNavigate }: EntityLinkProps) {
  const { node } = useOrgData();
  const entity = node(id);

  if (!entity) return <span className="text-ink-3">{id}</span>;

  return (
    <Link
      to={explorerPath(entity.type, id)}
      onClick={(event) => {
        event.stopPropagation();
        onNavigate?.();
      }}
      className={cn('inline-flex max-w-full min-w-0 items-center gap-1.5 rounded text-ink hover:underline', className)}
    >
      {glyph && <EntityGlyph type={entity.type} />}
      <span className="truncate">{entity.name}</span>
    </Link>
  );
}

/** Compact bordered variant for lists of related entities. */
export function EntityChip({ id, onNavigate, className }: { id: string; onNavigate?: () => void; className?: string }) {
  const { node } = useOrgData();
  const entity = node(id);
  if (!entity) return null;

  return (
    <Link
      to={explorerPath(entity.type, id)}
      onClick={(event) => {
        event.stopPropagation();
        onNavigate?.();
      }}
      title={`${ENTITY_META[entity.type].label}: ${entity.name}`}
      className={cn(
        'inline-flex h-6 max-w-[240px] items-center gap-1.5 rounded-md border border-line-strong bg-surface px-1.5 text-meta text-ink-2 transition-colors duration-100 hover:bg-surface-3 hover:text-ink',
        className,
      )}
    >
      <EntityGlyph type={entity.type} />
      <span className="truncate">{entity.name}</span>
    </Link>
  );
}
