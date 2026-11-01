import type {
  ActivityEvent,
  AssistantEvent,
  AssistantRequest,
  ConnectResult,
  EngineeringSignal,
  Insight,
  InsightStatus,
  Integration,
  IntegrationId,
  KnowledgeGraph,
  OrgDirectory,
  OrgOverview,
  SuggestionGroup,
} from './types';

export type ApiMode = 'mock' | 'http';

/**
 * Everything the UI needs from a backend.
 *
 * Pages depend on this interface only, so moving from sample data to FastAPI means
 * providing the matching endpoints (see README). `src/api/http/httpApi.ts` is the
 * implementation for real requests; `src/mocks/mockApi.ts` serves sample data.
 */
export interface OrgMindApi {
  readonly mode: ApiMode;

  getOverview(signal?: AbortSignal): Promise<OrgOverview>;
  getSignals(signal?: AbortSignal): Promise<EngineeringSignal[]>;
  listActivity(signal?: AbortSignal): Promise<ActivityEvent[]>;

  getDirectory(signal?: AbortSignal): Promise<OrgDirectory>;
  getGraph(signal?: AbortSignal): Promise<KnowledgeGraph>;

  listInsights(signal?: AbortSignal): Promise<Insight[]>;
  updateInsightStatus(id: string, status: InsightStatus): Promise<Insight>;

  listIntegrations(signal?: AbortSignal): Promise<Integration[]>;
  connectIntegration(id: IntegrationId): Promise<ConnectResult>;
  disconnectIntegration(id: IntegrationId): Promise<Integration>;

  /** Starter questions relevant to this organization. */
  listSuggestedQuestions(signal?: AbortSignal): Promise<SuggestionGroup[]>;

  /** Streams reasoning progress and the final answer. Rejects with AbortError when aborted. */
  askAssistant(
    request: AssistantRequest,
    onEvent: (event: AssistantEvent) => void,
    signal?: AbortSignal,
  ): Promise<void>;

  /** Demo mode only: clears locally stored finding and integration changes. */
  resetDemoState?(): void;
}
