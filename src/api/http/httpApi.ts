import type { OrgMindApi } from '../contract';
import type {
  ActivityEvent,
  AssistantEvent,
  ConnectResult,
  EngineeringSignal,
  Insight,
  Integration,
  KnowledgeGraph,
  OrgDirectory,
  OrgOverview,
  SuggestionGroup,
} from '../types';
import { apiUrl, ApiError, assertOk, request } from './client';

/**
 * Parses a `text/event-stream` body where every event is `data: <json>\n\n`.
 * FastAPI can produce this with `StreamingResponse(media_type="text/event-stream")`.
 */
async function readEventStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: AssistantEvent) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const data = frame
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())
        .join('\n');
      if (data && data !== '[DONE]') onEvent(JSON.parse(data) as AssistantEvent);
      boundary = buffer.indexOf('\n\n');
    }
  }
}

/** Real backend implementation. See the endpoint table in the README. */
export const httpApi: OrgMindApi = {
  mode: 'http',

  getOverview: (signal) => request<OrgOverview>('/org/overview', { signal }),
  getSignals: (signal) => request<EngineeringSignal[]>('/org/signals', { signal }),
  listActivity: (signal) => request<ActivityEvent[]>('/org/activity', { signal }),
  getDirectory: (signal) => request<OrgDirectory>('/org/directory', { signal }),
  getGraph: (signal) => request<KnowledgeGraph>('/graph', { signal }),

  listInsights: (signal) => request<Insight[]>('/insights', { signal }),
  updateInsightStatus: (id, status) =>
    request<Insight>(`/insights/${encodeURIComponent(id)}`, { method: 'PATCH', body: { status } }),

  listIntegrations: (signal) => request<Integration[]>('/integrations', { signal }),
  connectIntegration: (id) =>
    request<ConnectResult>(`/integrations/${id}/connect`, { method: 'POST' }),
  disconnectIntegration: (id) =>
    request<Integration>(`/integrations/${id}/disconnect`, { method: 'POST' }),

  listSuggestedQuestions: (signal) => request<SuggestionGroup[]>('/assistant/suggestions', { signal }),

  async askAssistant(payload, onEvent, signal) {
    let response: Response;
    try {
      response = await fetch(apiUrl('/assistant/query'), {
        method: 'POST',
        signal,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      throw new ApiError(0, 'Could not reach the OrgMind API. Check that the backend is running.');
    }

    await assertOk(response);
    if (!response.body) throw new ApiError(response.status, 'The assistant returned no stream.');
    await readEventStream(response.body, onEvent);
  },
};
