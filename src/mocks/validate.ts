import type { ActivityEvent, Insight, KnowledgeGraph, OrgDirectory } from '@/api/types';

/**
 * Development-only check that sample data references resolve. A typo in an id would
 * otherwise show up as a silently missing relationship.
 */
export function validateSampleData(
  directory: OrgDirectory,
  graph: KnowledgeGraph,
  insights: Insight[],
  activity: ActivityEvent[],
): void {
  const ids = new Set(graph.nodes.map((node) => node.id));
  const problems: string[] = [];
  const check = (id: string, where: string) => {
    if (!ids.has(id)) problems.push(`${where} references unknown id "${id}"`);
  };

  for (const edge of graph.edges) {
    check(edge.source, `edge ${edge.id}`);
    check(edge.target, `edge ${edge.id}`);
  }
  for (const insight of insights) {
    insight.entityIds.forEach((id) => check(id, `insight ${insight.id}`));
    check(insight.ownerTeamId, `insight ${insight.id}`);
  }
  for (const event of activity) {
    event.entityIds.forEach((id) => check(id, `activity ${event.id}`));
    check(event.actorId, `activity ${event.id}`);
  }
  for (const repo of directory.repositories) {
    if (!repo.maintainerIds.includes(repo.topContributorId)) {
      problems.push(`repository ${repo.id}: top contributor is not a maintainer`);
    }
  }

  if (problems.length > 0) {
    console.error(`[OrgMind] Sample data has ${problems.length} problem(s):\n${problems.join('\n')}`);
  }
}
