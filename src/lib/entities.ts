import {
  FolderGit2,
  Kanban,
  Scale,
  Server,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { EntityType, RelationType } from '@/api';

/** Canvas shape for a graph node. Shape carries type alongside colour for CVD readers. */
export type NodeShape = 'circle' | 'hexagon' | 'diamond' | 'square' | 'triangle' | 'star';

interface EntityMeta {
  label: string;
  plural: string;
  /** Path segment under /explorer. */
  segment: string;
  icon: LucideIcon;
  /** CSS custom property holding this type's identity colour. */
  colorVar: string;
  shape: NodeShape;
}

/**
 * Order is the validated categorical slot order, so adjacent segments in stacks and
 * legends clear the colour-vision checks. Colour follows the type and never changes
 * when a filter removes other types.
 */
export const ENTITY_TYPES: EntityType[] = [
  'person',
  'team',
  'project',
  'service',
  'repository',
  'decision',
];

export const ENTITY_META: Record<EntityType, EntityMeta> = {
  person: { label: 'Person', plural: 'People', segment: 'people', icon: User, colorVar: '--e-person', shape: 'circle' },
  team: { label: 'Team', plural: 'Teams', segment: 'teams', icon: Users, colorVar: '--e-team', shape: 'hexagon' },
  project: { label: 'Project', plural: 'Projects', segment: 'projects', icon: Kanban, colorVar: '--e-project', shape: 'diamond' },
  service: { label: 'Service', plural: 'Services', segment: 'services', icon: Server, colorVar: '--e-service', shape: 'square' },
  repository: { label: 'Repository', plural: 'Repositories', segment: 'repositories', icon: FolderGit2, colorVar: '--e-repository', shape: 'triangle' },
  decision: { label: 'Decision', plural: 'Decisions', segment: 'decisions', icon: Scale, colorVar: '--e-decision', shape: 'star' },
};

export function entityColor(type: EntityType): string {
  return `var(${ENTITY_META[type].colorVar})`;
}

export function segmentToType(segment: string | undefined): EntityType | undefined {
  return ENTITY_TYPES.find((type) => ENTITY_META[type].segment === segment);
}

export function explorerPath(type: EntityType, id?: string): string {
  const base = `/explorer/${ENTITY_META[type].segment}`;
  return id ? `${base}/${encodeURIComponent(id)}` : base;
}

export function graphPath(id: string): string {
  return `/graph?node=${encodeURIComponent(id)}`;
}

export function assistantPath(question: string): string {
  return `/assistant?q=${encodeURIComponent(question)}`;
}

/** How to read an edge from each end. */
export const RELATION_LABELS: Record<RelationType, { forward: string; reverse: string }> = {
  member_of: { forward: 'Member of', reverse: 'Members' },
  leads: { forward: 'Leads', reverse: 'Led by' },
  owns: { forward: 'Owns', reverse: 'Owned by' },
  maintains: { forward: 'Maintains', reverse: 'Maintained by' },
  source_of: { forward: 'Source of', reverse: 'Source code' },
  depends_on: { forward: 'Depends on', reverse: 'Depended on by' },
  on_call_for: { forward: 'On call for', reverse: 'On call' },
  contributes_to: { forward: 'Participates in', reverse: 'Teams involved' },
  changes: { forward: 'Changes', reverse: 'Changed by project' },
  authored: { forward: 'Authored', reverse: 'Authors' },
  governs: { forward: 'Governs', reverse: 'Governed by' },
  supersedes: { forward: 'Supersedes', reverse: 'Superseded by' },
};
