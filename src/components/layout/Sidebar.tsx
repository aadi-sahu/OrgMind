import { NavLink, useLocation } from 'react-router-dom';
import { FlaskConical, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { isDemoMode } from '@/api';
import { IconButton } from '@/components/ui/Button';
import { useInsights } from '@/hooks/useInsights';
import { cn } from '@/lib/cn';
import { isNavActive, NAV_GROUPS } from '@/lib/navigation';
import { LogoMark } from './Logo';

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
}

export function Sidebar({ collapsed = false, onToggleCollapsed, onNavigate }: SidebarProps) {
  const { pathname } = useLocation();
  const { alerts } = useInsights();

  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-12 shrink-0 items-center gap-2', collapsed ? 'justify-center px-2' : 'pr-2 pl-3.5')}>
        <LogoMark className="shrink-0" />
        {!collapsed && <span className="flex-1 truncate text-title font-semibold tracking-[-0.01em] text-ink">OrgMind</span>}
        {!collapsed && onToggleCollapsed && (
          <IconButton label="Collapse sidebar" size="sm" onClick={onToggleCollapsed}>
            <PanelLeftClose className="size-4" aria-hidden />
          </IconButton>
        )}
      </div>

      <nav aria-label="Main" className={cn('min-h-0 flex-1 overflow-y-auto pt-2 pb-4', collapsed ? 'px-2' : 'px-2.5')}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-4">
            {!collapsed && <p className="mb-1 px-2 text-micro font-medium text-ink-3">{group.label}</p>}
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = isNavActive(pathname, item.to);
                const count = item.to === '/intelligence' ? alerts.length : 0;
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      aria-label={count > 0 ? `${item.label}, ${count} urgent` : item.label}
                      className={cn(
                        'relative flex h-8 items-center gap-2.5 rounded-md text-ui transition-colors duration-100',
                        collapsed ? 'justify-center' : 'px-2',
                        active ? 'bg-surface-3 font-medium text-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                      {!collapsed && count > 0 && <span className="tabular text-meta text-ink-3">{count}</span>}
                      {collapsed && count > 0 && <span className="absolute top-1 right-1 size-1.5 rounded-full bg-serious" aria-hidden />}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn('shrink-0 border-t border-line p-2.5', collapsed && 'flex flex-col items-center gap-2 px-2')}>
        {isDemoMode &&
          (collapsed ? (
            <span title="Demo workspace: sample data, no backend connected" className="flex size-8 items-center justify-center text-ink-3">
              <FlaskConical className="size-4" aria-label="Demo workspace" />
            </span>
          ) : (
            <div className="rounded-md border border-line bg-surface-2 p-2.5">
              <p className="flex items-center gap-1.5 text-meta font-medium text-ink">
                <FlaskConical className="size-3.5 text-ink-3" aria-hidden />
                Demo workspace
              </p>
              <p className="mt-1 text-meta text-ink-3">
                Everything here is sample data for a fictional company. No backend is connected.
              </p>
            </div>
          ))}
        {collapsed && onToggleCollapsed && (
          <IconButton label="Expand sidebar" size="sm" onClick={onToggleCollapsed}>
            <PanelLeftOpen className="size-4" aria-hidden />
          </IconButton>
        )}
      </div>
    </div>
  );
}
