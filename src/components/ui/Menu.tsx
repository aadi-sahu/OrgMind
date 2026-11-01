import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Popover } from './Popover';

/** Keeps arrow-key focus moving through the [role=menuitem|option] elements of a list. */
function useRovingList(open: boolean) {
  const listRef = useRef<HTMLDivElement>(null);

  const items = () =>
    Array.from(listRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"]), [role="option"]') ?? []);

  const onKeyDown = (event: KeyboardEvent) => {
    const list = items();
    if (list.length === 0) return;
    const index = list.indexOf(document.activeElement as HTMLElement);
    const focus = (i: number) => list[(i + list.length) % list.length].focus();

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focus(index + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focus(index - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focus(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focus(list.length - 1);
    }
  };

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const list = items();
      const selected = list.find((item) => item.getAttribute('aria-selected') === 'true');
      (selected ?? list[0])?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  return { listRef, onKeyDown };
}

/* ------------------------------------------------------------------- Select */

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface SelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  label: string;
  /** Shown before the selected value when the select is a filter, as in "Severity: High". */
  prefix?: string;
  className?: string;
  align?: 'start' | 'end';
}

export function Select<T extends string>({ value, onChange, options, label, prefix, className, align }: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const close = useCallback(() => setOpen(false), []);
  const { listRef, onKeyDown } = useRovingList(open);
  const selected = options.find((option) => option.value === value);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${label}: ${selected?.label ?? ''}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          'inline-flex h-8 max-w-full items-center gap-1.5 rounded-md border border-line-strong bg-surface px-2.5 text-ui text-ink transition-colors duration-100 hover:bg-surface-2',
          className,
        )}
      >
        {prefix && <span className="text-ink-3">{prefix}</span>}
        {selected?.icon}
        <span className="truncate">{selected?.label}</span>
        <ChevronDown className="ml-auto size-3.5 shrink-0 text-ink-3" aria-hidden />
      </button>
      <Popover open={open} onClose={close} anchorRef={anchorRef} matchWidth align={align}>
        <div ref={listRef} id={listId} role="listbox" aria-label={label} className="p-1" onKeyDown={onKeyDown}>
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <div
                key={option.value}
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
                onClick={() => {
                  onChange(option.value);
                  close();
                  anchorRef.current?.focus();
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.currentTarget.click();
                  }
                }}
                className="flex h-8 cursor-pointer items-center gap-2 rounded px-2 text-ui whitespace-nowrap text-ink hover:bg-surface-3 focus:bg-surface-3 focus-visible:outline-none"
              >
                {option.icon}
                <span className="flex-1">{option.label}</span>
                {option.count !== undefined && <span className="tabular text-meta text-ink-3">{option.count}</span>}
                <Check className={cn('size-3.5 text-ink', isSelected ? 'opacity-100' : 'opacity-0')} aria-hidden />
              </div>
            );
          })}
        </div>
      </Popover>
    </>
  );
}

/* -------------------------------------------------------------------- Menu */

export interface MenuAction {
  id: string;
  label: string;
  icon?: ReactNode;
  description?: string;
  checked?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

interface MenuProps {
  trigger: (props: {
    ref: React.RefObject<HTMLButtonElement | null>;
    onClick: () => void;
    'aria-haspopup': 'menu';
    'aria-expanded': boolean;
  }) => ReactNode;
  items: (MenuAction | 'separator')[];
  label: string;
  align?: 'start' | 'end';
  header?: ReactNode;
  className?: string;
}

export function Menu({ trigger, items, label, align = 'end', header, className }: MenuProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const { listRef, onKeyDown } = useRovingList(open);

  return (
    <>
      {trigger({
        ref: anchorRef,
        onClick: () => setOpen((v) => !v),
        'aria-haspopup': 'menu',
        'aria-expanded': open,
      })}
      <Popover open={open} onClose={close} anchorRef={anchorRef} align={align} className={cn('min-w-48', className)}>
        {header}
        <div ref={listRef} role="menu" aria-label={label} className="p-1" onKeyDown={onKeyDown}>
          {items.map((item, index) =>
            item === 'separator' ? (
              <div key={`sep-${index}`} role="separator" className="my-1 h-px bg-line-strong" />
            ) : (
              <div
                key={item.id}
                role="menuitem"
                tabIndex={-1}
                aria-disabled={item.disabled || undefined}
                onClick={() => {
                  if (item.disabled) return;
                  close();
                  item.onSelect();
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.currentTarget.click();
                  }
                }}
                className={cn(
                  'flex min-h-8 items-center gap-2 rounded px-2 py-1.5 text-ui text-ink focus-visible:outline-none',
                  item.disabled
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer hover:bg-surface-3 focus:bg-surface-3',
                )}
              >
                {item.icon && <span className="text-ink-3 [&_svg]:size-4">{item.icon}</span>}
                <span className="min-w-0 flex-1">
                  <span className="block">{item.label}</span>
                  {item.description && <span className="block text-meta text-ink-3">{item.description}</span>}
                </span>
                {item.checked && <Check className="size-3.5" aria-hidden />}
              </div>
            ),
          )}
        </div>
      </Popover>
    </>
  );
}
