import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from './Button';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Traps Tab inside the container, closes on Escape and restores focus on unmount. */
export function useModalBehavior(containerRef: React.RefObject<HTMLElement | null>, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const initial = container.querySelector<HTMLElement>('[data-autofocus]') ?? container;
    initial.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === container)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [containerRef]);
}

interface OverlayProps {
  title: ReactNode;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Centered modal. Render it only while open. */
export function Dialog({ title, description, onClose, children, footer, className }: OverlayProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useModalBehavior(ref, onClose);

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end justify-center animate-fade-in bg-(--scrim) sm:items-center sm:p-6" onPointerDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'flex max-h-[90dvh] w-full animate-slide-in-up flex-col rounded-t-xl border border-line-strong bg-surface shadow-pop outline-none sm:max-w-lg sm:animate-rise sm:rounded-xl',
          className,
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-title font-semibold text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-ui text-ink-2">{description}</p>}
          </div>
          <IconButton label="Close" size="sm" onClick={onClose} className="-mt-1 -mr-1">
            <X className="size-4" aria-hidden />
          </IconButton>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

/** Right-side panel; takes the full width on small screens. Render it only while open. */
export function Drawer({ title, description, onClose, children, footer, className }: OverlayProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useModalBehavior(ref, onClose);

  return createPortal(
    <div className="fixed inset-0 z-40 flex justify-end animate-fade-in bg-(--scrim)" onPointerDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'flex h-full w-full animate-slide-in-right flex-col border-l border-line-strong bg-surface shadow-pop outline-none sm:w-[520px]',
          className,
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-title font-semibold break-words text-ink">{title}</h2>
            {description && <div className="mt-1 text-ui text-ink-2">{description}</div>}
          </div>
          <IconButton label="Close" size="sm" onClick={onClose} className="-mt-1 -mr-1">
            <X className="size-4" aria-hidden />
          </IconButton>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex flex-wrap gap-2 border-t border-line px-5 py-3">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
