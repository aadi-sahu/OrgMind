import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, MessageSquareText, Search } from 'lucide-react';
import { EntityGlyph } from '@/components/domain/entity';
import { useOrgData } from '@/hooks/useOrgData';
import { cn } from '@/lib/cn';
import { assistantPath, ENTITY_META, explorerPath, ENTITY_TYPES } from '@/lib/entities';
import { NAV_ITEMS } from '@/lib/navigation';
import type { GraphNode } from '@/api';

interface PaletteItem {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  to: string;
}

const MAX_ENTITY_RESULTS = 8;

function matchScore(node: GraphNode, query: string): number {
  const name = node.name.toLowerCase();
  if (name.startsWith(query)) return 3;
  if (name.split(/[\s/:-]+/).some((word) => word.startsWith(query))) return 2;
  if (name.includes(query) || node.subtitle.toLowerCase().includes(query)) return 1;
  return 0;
}

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { graph } = useOrgData();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();

    const pages: PaletteItem[] = NAV_ITEMS.filter(
      (item) => !q || item.label.toLowerCase().includes(q) || item.description.toLowerCase().includes(q),
    ).map((item) => {
      const Icon = item.icon;
      return {
        id: `page:${item.to}`,
        group: 'Pages',
        label: item.label,
        hint: item.description,
        icon: <Icon className="size-4 text-ink-3" aria-hidden />,
        to: item.to,
      };
    });

    if (!q) return pages;

    const entities: PaletteItem[] = (graph?.nodes ?? [])
      .map((node) => ({ node, score: matchScore(node, q) }))
      .filter((row) => row.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score ||
          ENTITY_TYPES.indexOf(a.node.type) - ENTITY_TYPES.indexOf(b.node.type) ||
          a.node.name.localeCompare(b.node.name),
      )
      .slice(0, MAX_ENTITY_RESULTS)
      .map(({ node }) => ({
        id: `entity:${node.id}`,
        group: 'Organization',
        label: node.name,
        hint: ENTITY_META[node.type].label,
        icon: (
          <span className="flex size-4 items-center justify-center">
            <EntityGlyph type={node.type} />
          </span>
        ),
        to: explorerPath(node.type, node.id),
      }));

    const ask: PaletteItem = {
      id: 'ask',
      group: 'Assistant',
      label: `Ask OrgMind: “${query.trim()}”`,
      icon: <MessageSquareText className="size-4 text-ink-3" aria-hidden />,
      to: assistantPath(query.trim()),
    };

    return [...entities, ...pages, ask];
  }, [query, graph]);

  useEffect(() => setActiveIndex(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const open = (item: PaletteItem | undefined) => {
    if (!item) return;
    onClose();
    navigate(item.to);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % Math.max(items.length, 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + items.length) % Math.max(items.length, 1));
    } else if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault();
      open(items[activeIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    } else if (event.key === 'Tab') {
      // The input is the only focus stop in this dialog; results are reached with the arrow keys.
      event.preventDefault();
    }
  };

  let lastGroup = '';

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-start justify-center bg-(--scrim) p-4 pt-[12dvh]"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-label="Search OrgMind" className="w-full max-w-xl animate-pop-in overflow-hidden rounded-xl bg-surface-2 shadow-pop">
        <div className="flex h-12 items-center gap-2.5 border-b border-line-strong px-3.5">
          <Search className="size-4 shrink-0 text-ink-3" aria-hidden />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-activedescendant={items[activeIndex] ? `palette-${activeIndex}` : undefined}
            aria-label="Search people, teams, services and pages, or ask a question"
            placeholder="Search people, teams, services, or ask a question"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-3 focus-visible:outline-none"
          />
          <kbd className="rounded border border-line-strong px-1 text-micro text-ink-3">esc</kbd>
        </div>
        <div ref={listRef} id="palette-results" role="listbox" aria-label="Results" className="max-h-[50dvh] overflow-y-auto p-1.5">
          {items.map((item, index) => {
            const showGroup = item.group !== lastGroup;
            lastGroup = item.group;
            return (
              <div key={item.id}>
                {showGroup && <p className="px-2 pt-2 pb-1 text-micro font-medium text-ink-3">{item.group}</p>}
                <div
                  id={`palette-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  onPointerMove={() => setActiveIndex(index)}
                  onClick={() => open(item)}
                  className={cn('flex h-9 cursor-pointer items-center gap-2.5 rounded-md px-2 text-ui text-ink', index === activeIndex && 'bg-surface-3')}
                >
                  {item.icon}
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.hint && <span className="hidden shrink-0 truncate text-meta text-ink-3 sm:block">{item.hint}</span>}
                  {index === activeIndex && <CornerDownLeft className="size-3.5 shrink-0 text-ink-3" aria-hidden />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
