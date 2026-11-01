import type {
  Decision,
  EntityType,
  EvidenceItem,
  Insight,
  InsightCategory,
  Person,
  Project,
  Repository,
  Service,
  Team,
} from '@/api/types';
import { directory } from '../data';
import { currentInsights } from '../demoState';

export const personById = new Map(directory.people.map((p) => [p.id, p]));
export const teamById = new Map(directory.teams.map((t) => [t.id, t]));
export const serviceById = new Map(directory.services.map((s) => [s.id, s]));
export const repoById = new Map(directory.repositories.map((r) => [r.id, r]));
export const projectById = new Map(directory.projects.map((p) => [p.id, p]));
export const decisionById = new Map(directory.decisions.map((d) => [d.id, d]));

export const personName = (id: string) => personById.get(id)?.name ?? id;
export const teamName = (id: string) => teamById.get(id)?.name ?? id;
export const serviceName = (id: string) => serviceById.get(id)?.name ?? id;

export type Mention =
  | { type: 'person'; entity: Person }
  | { type: 'team'; entity: Team }
  | { type: 'service'; entity: Service }
  | { type: 'repository'; entity: Repository }
  | { type: 'project'; entity: Project }
  | { type: 'decision'; entity: Decision };

interface Alias {
  text: string;
  mention: Mention;
  /** Added to the alias length when ranking, so specific entity types win ties. */
  priority: number;
}

const ALIASES: Alias[] = (() => {
  const aliases: Alias[] = [];
  const add = (text: string, mention: Mention, priority = 0) =>
    aliases.push({ text: text.toLowerCase(), mention, priority });

  for (const entity of directory.people) {
    const mention: Mention = { type: 'person', entity };
    const parts = entity.name.split(' ');
    add(entity.name, mention, 2);
    // "dev" would match too many ordinary questions, so it needs the full name.
    if (parts[0].toLowerCase() !== 'dev') add(parts[0], mention);
    if (parts[parts.length - 1].length > 3) add(parts[parts.length - 1], mention);
  }
  for (const entity of directory.teams) {
    const mention: Mention = { type: 'team', entity };
    add(entity.name, mention, 2);
    add(`${entity.name.split(/[ &]/)[0]} team`, mention, 1);
    add(entity.channel, mention);
  }
  for (const entity of directory.services) {
    const mention: Mention = { type: 'service', entity };
    add(entity.name, mention, 3);
    add(entity.name.replace(/-/g, ' '), mention, 2);
    add(entity.name.replace(/-(service|core|worker)$/, ''), mention, 1);
  }
  for (const entity of directory.repositories) {
    const mention: Mention = { type: 'repository', entity };
    const shortName = entity.name.split('/')[1];
    add(entity.name, mention, 2);
    add(shortName, mention);
    add(shortName.replace(/-/g, ' '), mention);
  }
  for (const entity of directory.projects) {
    add(entity.name, { type: 'project', entity }, 3);
  }
  for (const entity of directory.decisions) {
    const mention: Mention = { type: 'decision', entity };
    add(entity.code, mention, 4);
    add(entity.code.replace('-', ' '), mention, 4);
    add(entity.title, mention, 2);
  }
  return aliases.filter((alias) => alias.text.length > 2);
})();

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Entities named in the question, best match first, without overlapping names. */
export function findMentions(question: string): Mention[] {
  const text = question.toLowerCase();
  const matches = ALIASES.filter((alias) =>
    new RegExp(`(^|[^a-z0-9])${escapeRegExp(alias.text)}($|[^a-z0-9])`).test(text),
  ).sort((a, b) => b.text.length + b.priority - (a.text.length + a.priority));

  const claimed: string[] = [];
  const seen = new Set<string>();
  const mentions: Mention[] = [];

  for (const alias of matches) {
    // "route-engine" should not also count as the shorter match "route engine v3" or vice versa.
    if (claimed.some((longer) => longer.includes(alias.text))) continue;
    claimed.push(alias.text);
    if (seen.has(alias.mention.entity.id)) continue;
    seen.add(alias.mention.entity.id);
    mentions.push(alias.mention);
  }
  return mentions;
}

type EntityByType = { [M in Mention as M['type']]: M['entity'] };

export function firstOfType<T extends EntityType>(mentions: Mention[], type: T): EntityByType[T] | undefined {
  return mentions.find((mention) => mention.type === type)?.entity as EntityByType[T] | undefined;
}

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 } as const;

export const bySeverity = (a: Insight, b: Insight) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];

/** Findings still needing action, as the user has left them. Resolved and dismissed ones do not count. */
function activeInsights() {
  return currentInsights().filter((insight) => insight.status === 'open' || insight.status === 'acknowledged');
}

/** Active findings that mention an entity, most severe first. */
export function insightsFor(entityIds: string[]) {
  const ids = new Set(entityIds);
  return activeInsights()
    .filter((insight) => insight.entityIds.some((id) => ids.has(id)))
    .sort(bySeverity);
}

export function insightsByCategory(category: InsightCategory) {
  return activeInsights()
    .filter((insight) => insight.category === category)
    .sort(bySeverity);
}

/** The finding with exactly this title, whatever its status, as sent by "Ask OrgMind" on a finding. */
export function insightWithTitle(question: string) {
  const title = question.trim().replace(/[.?!]+$/, '').toLowerCase();
  return currentInsights().find((insight) => insight.title.toLowerCase() === title);
}

/** Services that depend on `serviceId`, directly or transitively, with hop distance. */
export function dependentsOf(serviceId: string): { service: Service; hops: number }[] {
  const result = new Map<string, number>();
  let frontier = [serviceId];
  let hops = 0;
  while (frontier.length > 0) {
    hops += 1;
    const next: string[] = [];
    for (const id of frontier) {
      for (const candidate of directory.services) {
        if (candidate.dependsOn.includes(id) && candidate.id !== serviceId && !result.has(candidate.id)) {
          result.set(candidate.id, hops);
          next.push(candidate.id);
        }
      }
    }
    frontier = next;
  }
  return [...result.entries()]
    .map(([id, distance]) => ({ service: serviceById.get(id) as Service, hops: distance }))
    .sort((a, b) => a.hops - b.hops || a.service.tier - b.service.tier);
}

/** Collects cited sources and hands out citation numbers. */
export class Citations {
  readonly sources: (EvidenceItem & { n: number })[] = [];

  add(item: EvidenceItem): string {
    const existing = this.sources.find((s) => s.title === item.title && s.system === item.system);
    if (existing) return `[${existing.n}]`;
    const n = this.sources.length + 1;
    this.sources.push({ ...item, n });
    return `[${n}]`;
  }
}

export const GRAPH_SYSTEM = 'Knowledge graph';
