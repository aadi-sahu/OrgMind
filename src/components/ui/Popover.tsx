import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  align?: 'start' | 'end';
  /** Match the anchor's width at minimum. */
  matchWidth?: boolean;
  className?: string;
  children: ReactNode;
}

const GAP = 4;
const VIEWPORT_MARGIN = 8;

/**
 * Floating layer positioned against an anchor. Portalled to <body> so it is never
 * clipped by scroll containers, and flips above the anchor when there is no room below.
 */
export function Popover({ open, onClose, anchorRef, align = 'start', matchWidth, className, children }: PopoverProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({ visibility: 'hidden' });

  const place = useCallback(() => {
    const anchor = anchorRef.current;
    const content = contentRef.current;
    if (!anchor || !content) return;

    const a = anchor.getBoundingClientRect();
    const c = content.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    const below = viewportH - a.bottom - GAP - VIEWPORT_MARGIN;
    const above = a.top - GAP - VIEWPORT_MARGIN;
    const placeAbove = c.height > below && above > below;

    const top = placeAbove ? Math.max(VIEWPORT_MARGIN, a.top - GAP - c.height) : a.bottom + GAP;
    const maxHeight = Math.max(120, placeAbove ? above : below);

    const rawLeft = align === 'end' ? a.right - c.width : a.left;
    const left = Math.min(Math.max(VIEWPORT_MARGIN, rawLeft), Math.max(VIEWPORT_MARGIN, viewportW - c.width - VIEWPORT_MARGIN));

    setStyle({
      position: 'fixed',
      top,
      left,
      maxHeight,
      minWidth: matchWidth ? a.width : undefined,
      maxWidth: `calc(100vw - ${VIEWPORT_MARGIN * 2}px)`,
    });
  }, [align, anchorRef, matchWidth]);

  useLayoutEffect(() => {
    if (!open) {
      setStyle({ visibility: 'hidden' });
      return;
    }
    place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (contentRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        anchorRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, onClose, anchorRef, place]);

  if (!open) return null;

  return createPortal(
    <div
      ref={contentRef}
      style={style}
      className={cn('z-50 animate-pop-in overflow-auto rounded-lg bg-surface-2 shadow-pop', className)}
    >
      {children}
    </div>,
    document.body,
  );
}
