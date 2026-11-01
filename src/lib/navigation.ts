import {
  Compass,
  LayoutDashboard,
  MessageSquareText,
  PlugZap,
  Radar,
  Share2,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, description: 'Organizational health and recent activity' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/graph', label: 'Knowledge Graph', icon: Share2, description: 'Explore entities and relationships' },
      { to: '/assistant', label: 'Assistant', icon: MessageSquareText, description: 'Ask evidence-backed questions' },
      { to: '/intelligence', label: 'Proactive Intelligence', icon: Radar, description: 'Risks found before you ask' },
    ],
  },
  {
    label: 'Organization',
    items: [
      { to: '/explorer', label: 'Explorer', icon: Compass, description: 'People, teams, projects and systems' },
      { to: '/integrations', label: 'Integrations', icon: PlugZap, description: 'Connect organizational data sources' },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

export function isNavActive(pathname: string, to: string): boolean {
  return to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`);
}
