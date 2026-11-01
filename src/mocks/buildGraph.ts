import type { GraphEdge, GraphNode, KnowledgeGraph, OrgDirectory, RelationType } from '@/api/types';

/**
 * Derives the sample knowledge graph from the directory, so that the graph, the Explorer
 * and the dashboard counts can never disagree. A real backend would return its stored
 * graph from GET /graph instead.
 */
export function buildGraph(directory: OrgDirectory): KnowledgeGraph {
  const { people, teams, projects, services, repositories, decisions } = directory;
  const teamName = new Map(teams.map((team) => [team.id, team.name]));

  const nodes: GraphNode[] = [
    ...people.map((p): GraphNode => ({ id: p.id, type: 'person', name: p.name, subtitle: p.role })),
    ...teams.map((t): GraphNode => ({ id: t.id, type: 'team', name: t.name, subtitle: t.channel })),
    ...projects.map((p): GraphNode => ({ id: p.id, type: 'project', name: p.name, subtitle: teamName.get(p.teamIds[0]) ?? '' })),
    ...services.map((s): GraphNode => ({ id: s.id, type: 'service', name: s.name, subtitle: `Tier ${s.tier} · ${s.runtime}` })),
    ...repositories.map((r): GraphNode => ({ id: r.id, type: 'repository', name: r.name, subtitle: `${r.provider} · ${r.language}` })),
    ...decisions.map((d): GraphNode => ({ id: d.id, type: 'decision', name: `${d.code}: ${d.title}`, subtitle: d.status })),
  ];

  const edges: GraphEdge[] = [];
  const link = (source: string, relation: RelationType, target: string) => {
    edges.push({ id: `${source}|${relation}|${target}`, source, target, relation });
  };

  for (const p of people) link(p.id, 'member_of', p.teamId);
  for (const t of teams) link(t.leadId, 'leads', t.id);
  for (const s of services) {
    link(s.teamId, 'owns', s.id);
    link(s.repositoryId, 'source_of', s.id);
    link(s.onCallId, 'on_call_for', s.id);
    for (const dependency of s.dependsOn) link(s.id, 'depends_on', dependency);
  }
  for (const r of repositories) {
    link(r.teamId, 'owns', r.id);
    for (const maintainer of r.maintainerIds) link(maintainer, 'maintains', r.id);
  }
  for (const p of projects) {
    link(p.leadId, 'leads', p.id);
    for (const team of p.teamIds) link(team, 'contributes_to', p.id);
    for (const service of p.serviceIds) link(p.id, 'changes', service);
  }
  for (const d of decisions) {
    for (const author of d.authorIds) link(author, 'authored', d.id);
    for (const service of d.serviceIds) link(d.id, 'governs', service);
    for (const repo of d.repositoryIds) link(d.id, 'governs', repo);
    if (d.supersededById) link(d.supersededById, 'supersedes', d.id);
  }

  return { nodes, edges };
}
