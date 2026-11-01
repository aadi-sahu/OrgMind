import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface TabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  items: TabItem<T>[];
  label: string;
  className?: string;
}

function useArrowKeys<T extends string>(items: TabItem<T>[], value: T, onChange: (value: T) => void) {
  const containerRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (event: KeyboardEvent) => {
    const index = items.findIndex((item) => item.value === value);
    let next = -1;
    if (event.key === 'ArrowRight') next = (index + 1) % items.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = items.length - 1;
    if (next === -1) return;

    event.preventDefault();
    onChange(items[next].value);
    containerRef.current?.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
  };

  return { containerRef, onKeyDown };
}

/** Underlined tabs for switching a page's main view. Scrolls sideways on narrow screens. */
export function Tabs<T extends string>({ value, onChange, items, label, className }: TabsProps<T>) {
  const { containerRef, onKeyDown } = useArrowKeys(items, value, onChange);

  // The active tab must be visible when the strip scrolls sideways, as after a deep link on a phone.
  useEffect(() => {
    const container = containerRef.current;
    const active = container?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (container && active) {
      container.scrollLeft = active.offsetLeft - container.offsetLeft - (container.clientWidth - active.offsetWidth) / 2;
    }
  }, [value, containerRef]);

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn('flex gap-4 overflow-x-auto border-b border-line [scrollbar-width:none]', className)}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={cn(
              '-mb-px flex h-9 shrink-0 items-center gap-1.5 border-b-2 text-ui whitespace-nowrap transition-colors duration-100',
              active ? 'border-ink text-ink' : 'border-transparent text-ink-3 hover:text-ink',
            )}
          >
            {item.icon}
            {item.label}
            {item.count !== undefined && <span className="tabular text-meta text-ink-3">{item.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Compact pill control for chart ranges and similar small choices. */
export function SegmentedControl<T extends string>({ value, onChange, items, label, className }: TabsProps<T>) {
  const { containerRef, onKeyDown } = useArrowKeys(items, value, onChange);

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn('inline-flex h-7 items-center rounded-md border border-line bg-bg p-0.5', className)}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={cn(
              'flex h-full items-center gap-1 rounded px-2 text-meta whitespace-nowrap transition-colors duration-100',
              active ? 'bg-surface-3 text-ink' : 'text-ink-3 hover:text-ink',
            )}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
