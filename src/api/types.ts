/**
 * Domain types shared by the UI and every API implementation.
 *
 * These describe the JSON the FastAPI backend is expected to return. Fields are
 * camelCase; the backend can match them with a Pydantic `alias_generator=to_camel`.
 * Timestamps are ISO-8601 strings.
 */

/* ------------------------------------------------------------------ Entities */

export type EntityType = 'person' | 'team' | 'project' | 'service' | 'repository' | 'decision';

export interface Person {
  id: string;
  name: string;
  role: string;
  teamId: string;
  email: string;
  location: string;
  expertise: string[];
  startedAt: string;
  status: 'active' | 'departing';
  /** Set when status is 'departing'. */
  lastDayAt?: string;
}

export interface Team {
  id: string;
  name: string;
  mission: string;
  leadId: string;
  channel: string;
}

export type ProjectStatus = 'on_track' | 'at_risk' | 'blocked' | 'completed';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  statusNote: string;
  progressPct: number;
  leadId: string;
  teamIds: string[];
  serviceIds: string[];
  startedAt: string;
  targetAt: string;
}

export type ServiceStatus = 'healthy' | 'degraded' | 'at_risk';

export interface Service {
  id: string;
  name: string;
  description: string;
  teamId: string;
  repositoryId: string;
  /** 0 is business critical. */
  tier: 0 | 1 | 2;
  runtime: string;
  status: ServiceStatus;
  onCallId: string;
  dependsOn: string[];
  deploysPerWeek: number;
  p95Ms: number;
  errorRatePct: number;
  lastDeployAt: string;
  docsUpdatedAt: string;
}

export interface Repository {
  id: string;
  name: string;
  provider: 'GitHub' | 'GitLab';
  language: string;
  teamId: string;
  maintainerIds: string[];
  topContributorId: string;
  /** Share of commits in the last 12 months from the top contributor, 0-100. */
  topContributorSharePct: number;
  busFactor: number;
  openPullRequests: number;
  /** Null for repositories with no executable code to cover, such as Terraform. */
  coveragePct: number | null;
  sizeKloc: number;
  lastCommitAt: string;
}

export type DecisionStatus = 'accepted' | 'proposed' | 'superseded';

export interface Decision {
  id: string;
  code: string;
  title: string;
  status: DecisionStatus;
  decidedAt: string;
  authorIds: string[];
  serviceIds: string[];
  repositoryIds: string[];
  context: string;
  outcome: string;
  alternatives: string[];
  source: string;
  supersededById?: string;
}

export interface OrgDirectory {
  people: Person[];
  teams: Team[];
  projects: Project[];
  services: Service[];
  repositories: Repository[];
  decisions: Decision[];
}

/* --------------------------------------------------------------------- Graph */

export type RelationType =
  | 'member_of'
  | 'leads'
  | 'owns'
  | 'maintains'
  | 'source_of'
  | 'depends_on'
  | 'on_call_for'
  | 'contributes_to'
  | 'changes'
  | 'authored'
  | 'governs'
  | 'supersedes';

export interface GraphNode {
  id: string;
  type: EntityType;
  name: string;
  subtitle: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: RelationType;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/* ------------------------------------------------------------------ Dashboard */

export interface TrendPoint {
  label: string;
  value: number;
}

export type HealthFactorId =
  | 'delivery'
  | 'reliability'
  | 'knowledge'
  | 'documentation'
  | 'dependencies';

export interface HealthFactor {
  id: HealthFactorId;
  label: string;
  score: number;
  weightPct: number;
  /** Change over the last four weeks, in points. */
  delta: number;
  explanation: string;
  /** Intelligence category to open when this factor is selected. */
  category: InsightCategory;
}

export interface OrgHealth {
  score: number;
  delta: number;
  trend: TrendPoint[];
  factors: HealthFactor[];
}

export interface GraphStats {
  nodes: number;
  edges: number;
  nodesAddedThisWeek: number;
  edgesAddedThisWeek: number;
  nodesByType: Record<EntityType, number>;
  growth: TrendPoint[];
  mostConnected: { id: string; name: string; type: EntityType; connections: number }[];
}

export interface OrgCounts {
  people: number;
  teams: number;
  projects: number;
  projectsNeedingAttention: number;
  services: number;
  servicesNeedingAttention: number;
  repositories: number;
  repositoriesAtRisk: number;
  decisions: number;
  decisionsProposed: number;
}

export interface Highlight {
  id: string;
  tone: 'risk' | 'positive' | 'neutral';
  title: string;
  body: string;
  /** Question to open in the assistant for more depth. */
  question?: string;
  entityIds: string[];
}

export interface OrgOverview {
  organizationName: string;
  summary: string;
  modelUpdatedAt: string;
  health: OrgHealth;
  counts: OrgCounts;
  graph: GraphStats;
  highlights: Highlight[];
}

export type SignalId =
  | 'deployDuration'
  | 'prCycleTime'
  | 'deployFrequency'
  | 'incidents'
  | 'docsFreshness';

export interface EngineeringSignal {
  id: SignalId;
  label: string;
  unit: string;
  description: string;
  /** Whether a lower value is the better direction. */
  lowerIsBetter: boolean;
  form: 'area' | 'bar';
  points: TrendPoint[];
}

export type ActivityType =
  | 'code_change'
  | 'ownership_change'
  | 'decision'
  | 'incident'
  | 'documentation'
  | 'meeting';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  title: string;
  detail: string;
  source: string;
  actorId: string;
  entityIds: string[];
  occurredAt: string;
  /** Extraction agent that turned the raw event into structured knowledge. */
  extractedBy: string;
  graphUpdates: number;
}

/* --------------------------------------------------------------- Intelligence */

export type InsightCategory =
  | 'tech_debt'
  | 'outdated_docs'
  | 'knowledge_silo'
  | 'duplicate_work'
  | 'deployment_risk'
  | 'dependency_issue';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type InsightStatus = 'open' | 'acknowledged' | 'resolved' | 'dismissed';

export type EvidenceKind =
  | 'metric'
  | 'pull_request'
  | 'commit'
  | 'adr'
  | 'incident'
  | 'document'
  | 'ticket'
  | 'message'
  | 'graph';

export interface EvidenceItem {
  kind: EvidenceKind;
  system: string;
  title: string;
  excerpt: string;
  occurredAt?: string;
  /** Only present when the evidence links to a real system of record. */
  href?: string;
}

export interface Insight {
  id: string;
  category: InsightCategory;
  severity: Severity;
  status: InsightStatus;
  title: string;
  summary: string;
  impact: string;
  detectedAt: string;
  /** Model confidence, 0-1. */
  confidence: number;
  ownerTeamId: string;
  entityIds: string[];
  evidence: EvidenceItem[];
  recommendations: string[];
}

/* --------------------------------------------------------------- Integrations */

export type IntegrationId =
  | 'github'
  | 'gitlab'
  | 'jira'
  | 'notion'
  | 'slack'
  | 'google-drive'
  | 'microsoft-teams';

/**
 * - not_connected: no credentials exist.
 * - connected: a backend holds working credentials and is syncing.
 * - simulated: demo mode only. The UI state was flipped locally and NO real
 *   connection exists. Must never be shown as "Connected".
 * - error: a backend connection exists but is failing.
 */
export type IntegrationStatus = 'not_connected' | 'connected' | 'simulated' | 'error';

export interface Integration {
  id: IntegrationId;
  name: string;
  category: string;
  description: string;
  authMethod: string;
  ingests: string[];
  scopes: string[];
  status: IntegrationStatus;
  /** When the connection was made (or simulated). */
  connectedAt?: string;
  lastSyncAt?: string;
  statusDetail?: string;
}

/** A backend connect call either finishes immediately or sends the user to OAuth. */
export type ConnectResult =
  | { kind: 'updated'; integration: Integration }
  | { kind: 'redirect'; authorizeUrl: string };

/* ------------------------------------------------------------------ Assistant */

export interface ReasoningStep {
  id: string;
  label: string;
  detail: string;
}

export interface AnswerSource extends EvidenceItem {
  /** 1-based citation number, referenced from answer text as [n]. */
  n: number;
}

export type AnswerBlock =
  | { kind: 'paragraph'; text: string }
  | {
      kind: 'findings';
      title: string;
      items: { title: string; detail: string; metric?: string }[];
    }
  | {
      kind: 'recommendations';
      title: string;
      items: { title: string; detail?: string; ownerId?: string }[];
    }
  | {
      kind: 'table';
      title: string;
      columns: string[];
      /** A cell is plain text or a link to an entity. */
      rows: (string | { entityId: string })[][];
    }
  | {
      kind: 'stacked-chart';
      title: string;
      subtitle: string;
      unit: string;
      xKey: string;
      series: { key: string; label: string }[];
      data: Record<string, string | number>[];
    };

export interface AssistantAnswer {
  summary: string;
  blocks: AnswerBlock[];
  confidence: 'high' | 'medium' | 'low';
  confidenceReason: string;
  sources: AnswerSource[];
  entityIds: string[];
  followUps: string[];
  /** False when the system could not ground an answer in organizational data. */
  grounded: boolean;
}

export type AssistantEvent =
  | { type: 'step'; step: ReasoningStep }
  | { type: 'summary_delta'; text: string }
  | { type: 'answer'; answer: AssistantAnswer };

export interface AssistantRequest {
  question: string;
  conversationId: string;
}

export type SuggestionTopic = 'architecture' | 'dependencies' | 'projects' | 'people';

export interface SuggestionGroup {
  topic: SuggestionTopic;
  label: string;
  questions: string[];
}
