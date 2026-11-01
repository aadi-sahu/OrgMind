import { useLocation } from 'react-router-dom';
import { Menu as MenuIcon, Moon, RotateCcw, Search, Sun } from 'lucide-react';
import { api, isDemoMode } from '@/api';
import { Button, IconButton } from '@/components/ui/Button';
import { Menu } from '@/components/ui/Menu';
import { useTheme } from '@/hooks/useTheme';
import { isNavActive, NAV_ITEMS } from '@/lib/navigation';
import { Avatar } from '@/components/domain/entity';
import { NotificationsMenu } from './NotificationsMenu';

interface TopbarProps {
  onOpenNav: () => void;
  onOpenSearch: () => void;
}

const isMac = /mac/i.test(navigator.userAgent);

export function Topbar({ onOpenNav, onOpenSearch }: TopbarProps) {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const current = NAV_ITEMS.find((item) => isNavActive(pathname, item.to));

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line bg-bg px-3 md:px-4">
      <IconButton label="Open navigation" className="md:hidden" onClick={onOpenNav}>
        <MenuIcon className="size-4" aria-hidden />
      </IconButton>

      <p className="min-w-0 truncate text-ui font-medium text-ink">{current?.label ?? 'OrgMind'}</p>

      {isDemoMode && (
        <span
          title="This workspace shows sample data for a fictional company. No backend is connected."
          className="inline-flex h-5 shrink-0 items-center rounded border border-line-strong px-1.5 text-micro font-medium text-ink-3"
        >
          <span className="sm:hidden">Demo</span>
          <span className="hidden sm:inline">Demo data</span>
        </span>
      )}

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={onOpenSearch}
          className="mr-1 hidden h-8 w-56 items-center gap-2 rounded-md border border-line-strong bg-surface px-2.5 text-ui text-ink-3 transition-colors duration-100 hover:bg-surface-2 hover:text-ink-2 md:flex"
        >
          <Search className="size-3.5" aria-hidden />
          <span className="flex-1 text-left">Search or ask</span>
          <kbd className="rounded border border-line-strong px-1 text-micro">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
        </button>
        <IconButton label="Search or ask" className="md:hidden" onClick={onOpenSearch}>
          <Search className="size-4" aria-hidden />
        </IconButton>

        <NotificationsMenu />

        <IconButton label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
        </IconButton>

        <Menu
          label="Account"
          className="w-60"
          header={
            <div className="border-b border-line-strong px-3 py-2.5">
              <p className="text-ui font-medium text-ink">{isDemoMode ? 'Demo user' : 'Account'}</p>
              <p className="text-meta text-ink-3">
                {isDemoMode ? 'Sign-in needs the backend' : 'Sign-in is not set up yet'}
              </p>
            </div>
          }
          items={
            isDemoMode
              ? [
                  {
                    id: 'reset',
                    label: 'Reset demo data',
                    description: 'Restores findings and integrations',
                    icon: <RotateCcw />,
                    onSelect: () => {
                      api.resetDemoState?.();
                      window.location.reload();
                    },
                  },
                ]
              : []
          }
          trigger={(props) => (
            <Button variant="ghost" aria-label="Account menu" className="ml-1 w-8 px-0" {...props}>
              <Avatar name={isDemoMode ? 'Demo User' : 'User'} />
            </Button>
          )}
        />
      </div>
    </header>
  );
}
