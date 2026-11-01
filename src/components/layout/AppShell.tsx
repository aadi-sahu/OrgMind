import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { IconButton } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/States';
import { cn } from '@/lib/cn';
import { CommandPalette } from './CommandPalette';
import { ErrorBoundary } from './ErrorBoundary';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const COLLAPSED_KEY = 'orgmind.sidebar.collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

function PageFallback() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-4 p-6" role="status" aria-label="Loading page">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-80" />
      <Skeleton className="mt-6 h-64 w-full rounded-lg" />
    </div>
  );
}

export function AppShell() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((value) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, value ? '0' : '1');
      } catch {
        // Keeps working for this session without storage.
      }
      return !value;
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // A new page starts at the top. Detail drawers on the same page keep their scroll position.
  const section = pathname.split('/')[1];
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [section]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileNavOpen]);

  return (
    <div className="flex h-dvh overflow-hidden bg-bg">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface-2 focus:px-3 focus:py-1.5 focus:text-ui">
        Skip to content
      </a>

      <aside className={cn('hidden shrink-0 border-r border-line bg-bg transition-[width] duration-150 md:block', collapsed ? 'w-13' : 'w-56')}>
        <Sidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      </aside>

      {mobileNavOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-40 animate-fade-in bg-(--scrim) md:hidden"
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) setMobileNavOpen(false);
            }}
          >
            <div className="relative h-full w-64 animate-slide-in-left border-r border-line-strong bg-bg">
              <IconButton label="Close navigation" size="sm" className="absolute top-2.5 right-2 z-10" onClick={() => setMobileNavOpen(false)}>
                <X className="size-4" aria-hidden />
              </IconButton>
              <Sidebar onNavigate={() => setMobileNavOpen(false)} />
            </div>
          </div>,
          document.body,
        )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenNav={() => setMobileNavOpen(true)} onOpenSearch={() => setSearchOpen(true)} />
        <main id="main" ref={mainRef} className="min-h-0 flex-1 overflow-y-auto">
          <ErrorBoundary key={section}>
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {searchOpen && <CommandPalette onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
