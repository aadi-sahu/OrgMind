import type {
  EntityType,
  GraphStats,
  HealthFactor,
  Highlight,
  KnowledgeGraph,
  OrgCounts,
  OrgDirectory,
  OrgHealth,
  OrgOverview,
} from '@/api/types';
import { deployStages, engineeringSignals, graphGrowth, ORGANIZATION_NAME } from './data';
import { minutesAgo, weekLabel } from './data/time';

function buildFactors(directory: OrgDirectory): HealthFactor[] {
  const singleOwnerRepos = directory.repositories.filter((r) => r.busFactor === 1).length;
  return [
    {
      id: 'delivery', label: 'Delivery', score: 74, weightPct: 25, delta: -4, category: 'deployment_risk',
      explanation: 'Slower pipelines and fewer deploys, partly offset by faster pull request reviews.',
    },
    {
      id: 'reliability', label: 'Reliability', score: 72, weightPct: 25, delta: -3, category: 'deployment_risk',
      explanation: 'Incident count is rising, led by route-engine.',
    },
    {
      id: 'knowledge', label: 'Knowledge distribution', score: 52, weightPct: 20, delta: -6, category: 'knowledge_silo',
      explanation: `${singleOwnerRepos} repositories have a bus factor of one, including Tier 0 code.`,
    },
    {
      id: 'documentation', label: 'Documentation freshness', score: 61, weightPct: 15, delta: -2, category: 'outdated_docs',
      explanation: '58% of documents were updated within 90 days of the code they describe.',
    },
    {
      id: 'dependencies', label: 'Dependency health', score: 64, weightPct: 15, delta: -1, category: 'dependency_issue',
      explanation: 'One known vulnerability, one dependency cycle and one breaking endpoint removal.',
    },
  ];
}

function buildHealth(directory: OrgDirectory): OrgHealth {
  const factors = buildFactors(directory);
  const score = Math.round(factors.reduce((sum, f) => sum + (f.score * f.weightPct) / 100, 0));
  const history = [75, 75, 76, 74, 74, 73, 73, 72, 71, 70, 69];
  const values = [...history, score];
  const trend = values.map((value, i) => ({ label: weekLabel(values.length - 1 - i), value }));
  return { score, delta: score - values[values.length - 5], trend, factors };
}

function buildCounts(directory: OrgDirectory): OrgCounts {
  const { people, teams, projects, services, repositories, decisions } = directory;
  return {
    people: people.length,
    teams: teams.length,
    projects: projects.length,
    projectsNeedingAttention: projects.filter((p) => p.status === 'at_risk' || p.status === 'blocked').length,
    services: services.length,
    servicesNeedingAttention: services.filter((s) => s.status !== 'healthy').length,
    repositories: repositories.length,
    repositoriesAtRisk: repositories.filter((r) => r.busFactor === 1).length,
    decisions: decisions.length,
    decisionsProposed: decisions.filter((d) => d.status === 'proposed').length,
  };
}

function buildGraphStats(graph: KnowledgeGraph): GraphStats {
  const degree = new Map<string, number>();
  for (const edge of graph.edges) {
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
  }

  const nodesByType = { person: 0, team: 0, project: 0, service: 0, repository: 0, decision: 0 } satisfies Record<EntityType, number>;
  for (const node of graph.nodes) nodesByType[node.type] += 1;

  const mostConnected = [...graph.nodes]
    .sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0))
    .slice(0, 5)
    .map((node) => ({ id: node.id, name: node.name, type: node.type, connections: degree.get(node.id) ?? 0 }));

  const growth = graphGrowth(graph.nodes.length, graph.edges.length);
  const lastWeek = (series: { value: number }[]) => series[series.length - 1].value - series[series.length - 2].value;

  return {
    nodes: graph.nodes.length,
    edges: graph.edges.length,
    nodesAddedThisWeek: lastWeek(growth.nodes),
    edgesAddedThisWeek: lastWeek(growth.edges),
    nodesByType,
    growth: growth.edges,
    mostConnected,
  };
}

function buildHighlights(): Highlight[] {
  const first = deployStages[0];
  const last = deployStages[deployStages.length - 1];
  const share = Math.round(((last.integration - first.integration) / (last.total - first.total)) * 100);

  const prCycle = engineeringSignals.find((signal) => signal.id === 'prCycleTime')?.points ?? [];
  const beforeRotation = prCycle[prCycle.length - 10]?.value ?? 0;
  const latestCycle = prCycle[prCycle.length - 1]?.value ?? 0;
  const prImprovement = beforeRotation ? Math.round(((beforeRotation - latestCycle) / beforeRotation) * 100) : 0;

  return [
    {
      id: 'hl-deploy', tone: 'risk',
      title: 'Deploy time has more than doubled in 26 weeks',
      body: `Median pipeline duration rose from ${first.total} to ${last.total} minutes. About ${share}% of the increase comes from the integration test stage that followed ADR-035.`,
      question: 'Why has deployment time increased?',
      entityIds: ['adr-035', 'repo-ci-templates'],
    },
    {
      id: 'hl-ledger', tone: 'risk',
      title: 'Ledger knowledge is about to leave the company',
      body: 'Henrik Lindqvist wrote 91% of ledger-core and leaves in 14 days. The reconciliation handover has no date, and a schema migration is planned before month-end close.',
      question: 'What happens when Henrik Lindqvist leaves?',
      entityIds: ['svc-ledger', 'p-henrik'],
    },
    {
      id: 'hl-dup', tone: 'neutral',
      title: 'Two teams are building the same rate limiter',
      body: 'Platform Infrastructure and Carrier Network are each implementing a Redis token bucket. Combining them now would avoid operating two limiters later.',
      question: 'What duplicate work is happening across teams?',
      entityIds: ['proj-gw-rate', 'proj-carrier-throttle'],
    },
    {
      id: 'hl-reviews', tone: 'positive',
      title: 'Pull request cycle time is improving',
      body: `Median cycle time has dropped by about ${prImprovement}% since the review rotation began nine weeks ago, even while pipelines got slower.`,
      entityIds: [],
    },
  ];
}

export function buildOverview(directory: OrgDirectory, graph: KnowledgeGraph): OrgOverview {
  return {
    organizationName: ORGANIZATION_NAME,
    summary: 'Freight logistics platform. Six engineering teams operate routing, billing and carrier connectivity.',
    modelUpdatedAt: minutesAgo(4),
    health: buildHealth(directory),
    counts: buildCounts(directory),
    graph: buildGraphStats(graph),
    highlights: buildHighlights(),
  };
}
