import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Maximize, Minus, Plus, SearchX, Table2 } from 'lucide-react';
import { isDemoMode, type EntityType, type RelationType } from '@/api';
import { EntityGlyph } from '@/components/domain/entity';
import { SampleTag } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { Select } from '@/components/ui/Menu';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { SegmentedControl } from '@/components/ui/Tabs';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useOrgData } from '@/hooks/useOrgData';
import { cn } from '@/lib/cn';
import { ENTITY_META, ENTITY_TYPES } from '@/lib/entities';
import { neighborhood } from '@/lib/graph';
import { GraphCanvas, type GraphCanvasHandle } from './GraphCanvas';
import { GraphSearch } from './GraphSearch';
import { NodeDetailPanel } from './NodeDetailPanel';

type RelationFilter = 'all' | 'dependencies' | 'ownership' | 'people' | 'decisions';

const RELATION_FILTERS: { value: RelationFilter; label: string; relations?: RelationType[] }[] = [
  { value: 'all', label: 'All relationships' },
  { value: 'dependencies', label: 'Service dependencies', relations: ['depends_on'] },
  { value: 'ownership', label: 'Ownership', relations: ['owns', 'source_of', 'maintains', 'on_call_for'] },
  { value: 'people', label: 'Teams and projects', relations: ['member_of', 'leads', 'contributes_to', 'changes'] },
  { value: 'decisions', label: 'Technical decisions', relations: ['authored', 'governs', 'supersedes'] },
];

type Depth = 'all' | '1' | '2';

const ALL_TYPES = new Set<EntityType>(ENTITY_TYPES);

export default function GraphPage() {
  const { graph, directory, index, loading, error, retry } = useOrgData();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('node');

  const [activeTypes, setActiveTypes] = useState<Set<EntityType>>(ALL_TYPES);
  const [relationFilter, setRelationFilter] = useState<RelationFilter>('all');
  const [depth, setDepth] = useState<Depth>('all');

  const canvasRef = useRef<GraphCanvasHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // A callback ref, because the container only mounts once the data has loaded.
  const observerRef = useRef<ResizeObserver | null>(null);
  const setContainer = useCallback((element: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    containerRef.current = element;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: Math.floor(entry.contentRect.width), height: Math.floor(entry.contentRect.height) });
    });
    observer.observe(element);
    observerRef.current = observer;
  }, []);
  useEffect(() => () => observerRef.current?.disconnect(), []);

  const select = useCallback(
    (id: string | null) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (id) next.set('node', id);
          else next.delete('node');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const relations = RELATION_FILTERS.find((f) => f.value === relationFilter)?.relations;

  const { visibleNodes, visibleEdges } = useMemo(() => {
    if (!graph || !index) return { visibleNodes: [], visibleEdges: [] };

    const focus = selectedId && depth !== 'all' ? neighborhood(index, selectedId, Number(depth)) : null;

    const typed = new Set(
      graph.nodes.filter((n) => activeTypes.has(n.type) && (!focus || focus.has(n.id))).map((n) => n.id),
    );
    const edges = graph.edges.filter(
      (e) => typed.has(e.source) && typed.has(e.target) && (!relations || relations.includes(e.relation)),
    );

    // A relationship filter hides entities it leaves with nothing to show.
    const connected = new Set(edges.flatMap((e) => [e.source, e.target]));
    const nodes = graph.nodes.filter((n) => typed.has(n.id) && (!relations || connected.has(n.id) || n.id === selectedId));

    return { visibleNodes: nodes, visibleEdges: edges };
  }, [graph, index, activeTypes, relations, selectedId, depth]);

  const countsByType = useMemo(() => {
    const counts = new Map<EntityType, number>();
    for (const node of graph?.nodes ?? []) counts.set(node.type, (counts.get(node.type) ?? 0) + 1);
    return counts;
  }, [graph]);

  const selectedNode = selectedId ? index?.nodeById.get(selectedId) : undefined;

  // Selecting something (including from a deep link or search) brings it into view.
  useEffect(() => {
    if (!selectedNode) return;
    const timer = setTimeout(() => canvasRef.current?.focusNode(selectedNode.id), 60);
    return () => clearTimeout(timer);
  }, [selectedNode]);

  useEffect(() => {
    if (!selectedId) setDepth('all');
  }, [selectedId]);

  const selectFromSearch = useCallback(
    (id: string) => {
      // A filter must not hide what the user explicitly asked to see.
      const type = index?.nodeById.get(id)?.type;
      if (type) setActiveTypes((current) => (current.has(type) ? current : new Set(current).add(type)));
      setRelationFilter('all');
      select(id);
    },
    [index, select],
  );

  const toggleType = (type: EntityType) => {
    setActiveTypes((current) => {
      const next = new Set(current);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const resetFilters = () => {
    setActiveTypes(ALL_TYPES);
    setRelationFilter('all');
    setDepth('all');
  };

  if (error) return <ErrorState error={error} onRetry={retry} className="h-full" />;

  const isFiltered = activeTypes.size < ENTITY_TYPES.length || relationFilter !== 'all' || depth !== 'all';

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Filters: one row above everything they scope */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2 md:px-4">
        <GraphSearch nodes={graph?.nodes ?? []} onSelect={selectFromSearch} className="w-full sm:w-56" />
        <Select
          label="Relationship filter"
          value={relationFilter}
          onChange={setRelationFilter}
          options={RELATION_FILTERS.map(({ value, label }) => ({ value, label }))}
        />
        {selectedNode && (
          <div className="flex items-center gap-1.5">
            <span className="text-meta text-ink-3">Focus</span>
            <SegmentedControl
              label="Focus depth"
              value={depth}
              onChange={setDepth}
              items={[
                { value: 'all', label: 'All' },
                { value: '1', label: '1 hop' },
                { value: '2', label: '2 hops' },
              ]}
            />
          </div>
        )}
        {isFiltered && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Reset
          </Button>
        )}
        <div className="ml-auto flex items-center gap-3">
          {isDemoMode && <SampleTag />}
          <p className="tabular hidden text-meta text-ink-3 sm:block" aria-live="polite">
            {visibleNodes.length} entities · {visibleEdges.length} relationships
          </p>
          <Link to="/explorer" className="hidden items-center gap-1 text-meta text-ink-2 hover:text-ink hover:underline sm:flex">
            <Table2 className="size-3.5" aria-hidden />
            View as tables
          </Link>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="relative min-h-0 min-w-0 flex-1">
          <div ref={setContainer} className="absolute inset-0 overflow-hidden">
            {loading ? (
              <div className="flex h-full items-center justify-center" role="status" aria-label="Loading knowledge graph">
                <Skeleton className="size-40 rounded-full" />
              </div>
            ) : visibleNodes.length === 0 ? (
              <EmptyState
                className="h-full"
                icon={<SearchX className="size-4" aria-hidden />}
                title="No entities match these filters"
                description="Turn on more entity types or choose a different relationship."
                action={<Button size="sm" onClick={resetFilters}>Reset filters</Button>}
              />
            ) : (
              index &&
              size.width > 0 && (
                <div role="img" aria-label={`Knowledge graph showing ${visibleNodes.length} entities and ${visibleEdges.length} relationships. Use the search field to select an entity, or view the same data as tables in the Explorer.`}>
                  <GraphCanvas
                    ref={canvasRef}
                    nodes={visibleNodes}
                    edges={visibleEdges}
                    index={index}
                    selectedId={selectedId}
                    onSelect={select}
                    width={size.width}
                    height={size.height}
                  />
                </div>
              )
            )}
          </div>

          {/* Entity types: legend and filter in one, with shape and colour both carrying type */}
          <div className="pointer-events-none absolute top-3 right-3 left-3 flex flex-wrap gap-1.5">
            {ENTITY_TYPES.map((type) => {
              const active = activeTypes.has(type);
              return (
                <button
                  key={type}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleType(type)}
                  className={cn(
                    'pointer-events-auto flex h-7 items-center gap-1.5 rounded-md border bg-surface px-2 text-meta transition-colors duration-100 hover:bg-surface-2',
                    active ? 'border-line-strong text-ink' : 'border-line text-ink-3 line-through',
                  )}
                >
                  <EntityGlyph type={type} className={active ? '' : 'opacity-40'} />
                  {ENTITY_META[type].plural}
                  <span className="tabular text-ink-3">{countsByType.get(type) ?? 0}</span>
                </button>
              );
            })}
          </div>

          <div className="absolute right-3 bottom-3 flex flex-col overflow-hidden rounded-md border border-line-strong bg-surface">
            <IconButton label="Zoom in" size="sm" className="rounded-none" onClick={() => canvasRef.current?.zoomIn()}>
              <Plus className="size-3.5" aria-hidden />
            </IconButton>
            <IconButton label="Zoom out" size="sm" className="rounded-none border-t border-line" onClick={() => canvasRef.current?.zoomOut()}>
              <Minus className="size-3.5" aria-hidden />
            </IconButton>
            <IconButton label="Fit to screen" size="sm" className="rounded-none border-t border-line" onClick={() => canvasRef.current?.fit()}>
              <Maximize className="size-3.5" aria-hidden />
            </IconButton>
          </div>

          {!selectedNode && !loading && visibleNodes.length > 0 && (
            <p className="pointer-events-none absolute bottom-3 left-3 hidden text-meta text-ink-3 sm:block">
              Click an entity for details. Drag to move, scroll to zoom.
            </p>
          )}
        </div>

        {selectedNode && directory && (
          <aside
            className={cn(
              'shrink-0 border-line bg-surface',
              isDesktop ? 'w-[340px] animate-slide-in-right border-l' : 'h-[52dvh] animate-slide-in-up border-t',
            )}
          >
            <NodeDetailPanel node={selectedNode} directory={directory} onSelect={select} onClose={() => select(null)} />
          </aside>
        )}
      </div>
    </div>
  );
}
