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

/** The event stream format allows any of these line endings, and sse-starlette uses \r\n. */
const FRAME_BOUNDARY = /\r\n\r\n|\n\n|\r\r/;

function parseFrame(frame: string, status: number): AssistantEvent | undefined {
  const data = frame
    .split(/\r\n|\n|\r/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .join('\n');
  if (!data || data === '[DONE]') return undefined;

  try {
    return JSON.parse(data) as AssistantEvent;
  } catch {
    throw new ApiError(status, 'The assistant sent a response that could not be read. Try asking again.');
  }
}

/**
 * Parses a `text/event-stream` body where every event is `data: <json>` and a blank line.
 * FastAPI can produce this with `StreamingResponse(media_type="text/event-stream")`.
 */
async function readEventStream(
  body: ReadableStream<Uint8Array>,
  status: number,
  onEvent: (event: AssistantEvent) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const emit = (frame: string) => {
    const event = parseFrame(frame, status);
    if (event) onEvent(event);
  };

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    for (let match = FRAME_BOUNDARY.exec(buffer); match; match = FRAME_BOUNDARY.exec(buffer)) {
      emit(buffer.slice(0, match.index));
      buffer = buffer.slice(match.index + match[0].length);
    }
  }

  // A server may close the stream without the blank line that ends its last event.
  emit(buffer + decoder.decode());
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
    await readEventStream(response.body, response.status, onEvent);
  },
};
