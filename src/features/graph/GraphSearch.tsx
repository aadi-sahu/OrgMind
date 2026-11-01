import { useCallback, useMemo, useRef, useState } from 'react';
import type { GraphNode } from '@/api';
import { EntityGlyph } from '@/components/domain/entity';
import { Popover } from '@/components/ui/Popover';
import { SearchInput } from '@/components/ui/SearchInput';
import { cn } from '@/lib/cn';
import { ENTITY_META } from '@/lib/entities';

const MAX_RESULTS = 8;

/** Finds an entity by name and selects it on the graph. Also the keyboard path into the canvas. */
export function GraphSearch({ nodes, onSelect, className }: { nodes: GraphNode[]; onSelect: (id: string) => void; className?: string }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const anchorRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return nodes
      .filter((node) => node.name.toLowerCase().includes(q) || node.subtitle.toLowerCase().includes(q))
      .sort((a, b) => Number(b.name.toLowerCase().startsWith(q)) - Number(a.name.toLowerCase().startsWith(q)) || a.name.localeCompare(b.name))
      .slice(0, MAX_RESULTS);
  }, [nodes, query]);

  const choose = (node: GraphNode | undefined) => {
    if (!node) return;
    onSelect(node.id);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={anchorRef} className={className}>
      <SearchInput
        label="Search the graph"
        placeholder="Find an entity"
        value={query}
        role="combobox"
        aria-expanded={open && query.trim().length > 0}
        aria-controls="graph-search-results"
        aria-autocomplete="list"
        onChange={(value) => {
          setQuery(value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, results.length - 1));
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
          } else if (event.key === 'Enter') {
            event.preventDefault();
            choose(results[activeIndex]);
          }
        }}
      />
      <Popover open={open && query.trim().length > 0} onClose={close} anchorRef={anchorRef} matchWidth className="w-72">
        {results.length === 0 ? (
          <p className="px-3 py-3 text-ui text-ink-3">No entities match “{query.trim()}”.</p>
        ) : (
          <ul id="graph-search-results" role="listbox" aria-label="Matching entities" className="p-1">
            {results.map((node, index) => (
              <li
                key={node.id}
                role="option"
                aria-selected={index === activeIndex}
                onPointerMove={() => setActiveIndex(index)}
                onClick={() => choose(node)}
                className={cn('flex h-9 cursor-pointer items-center gap-2 rounded px-2 text-ui text-ink', index === activeIndex && 'bg-surface-3')}
              >
                <EntityGlyph type={node.type} />
                <span className="min-w-0 flex-1 truncate">{node.name}</span>
                <span className="shrink-0 text-meta text-ink-3">{ENTITY_META[node.type].label}</span>
              </li>
            ))}
          </ul>
        )}
      </Popover>
    </div>
  );
}
