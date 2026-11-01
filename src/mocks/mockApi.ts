import type { OrgMindApi } from '@/api/contract';
import type { Integration, IntegrationId } from '@/api/types';
import { buildGraph } from './buildGraph';
import { buildOverview } from './buildOverview';
import { activity, directory, engineeringSignals, insights, integrationCatalog, suggestedQuestions } from './data';
import { currentInsights, resetDemoState, setInsightStatus, setSimulatedAt, simulatedAt } from './demoState';
import { reason } from './reasoner';
import { validateSampleData } from './validate';

/**
 * Demo implementation of the API. No network requests are made.
 *
 * Delays exist so that loading states behave as they will with a real backend.
 */

const graph = buildGraph(directory);
if (import.meta.env.DEV) validateSampleData(directory, graph, insights, activity);

function abortError() {
  return new DOMException('The request was aborted.', 'AbortError');
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

const latency = () => 220 + Math.random() * 280;

async function respond<T>(value: () => T, signal?: AbortSignal): Promise<T> {
  await delay(latency(), signal);
  // Clone so that callers can never mutate the sample data.
  return structuredClone(value());
}

function withSimulation(integration: Integration): Integration {
  const connectedAt = simulatedAt(integration.id);
  if (!connectedAt) return integration;
  return {
    ...integration,
    status: 'simulated',
    connectedAt,
    statusDetail: 'Demo only. No credentials were requested, and no data is being synced.',
  };
}

function findIntegration(id: IntegrationId): Integration {
  const integration = integrationCatalog.find((candidate) => candidate.id === id);
  if (!integration) throw new Error(`Unknown integration: ${id}`);
  return integration;
}

export const mockApi: OrgMindApi = {
  mode: 'mock',

  getOverview: (signal) => respond(() => buildOverview(directory, graph), signal),
  getSignals: (signal) => respond(() => engineeringSignals, signal),
  listActivity: (signal) => respond(() => activity, signal),
  getDirectory: (signal) => respond(() => directory, signal),
  getGraph: (signal) => respond(() => graph, signal),

  listInsights: (signal) => respond(currentInsights, signal),

  async updateInsightStatus(id, status) {
    await delay(180);
    const insight = insights.find((candidate) => candidate.id === id);
    if (!insight) throw new Error(`Unknown insight: ${id}`);
    setInsightStatus(id, status);
    return { ...insight, status };
  },

  listIntegrations: (signal) => respond(() => integrationCatalog.map(withSimulation), signal),

  async connectIntegration(id) {
    await delay(900);
    setSimulatedAt(id, new Date().toISOString());
    return { kind: 'updated', integration: withSimulation(findIntegration(id)) };
  },

  async disconnectIntegration(id) {
    await delay(400);
    setSimulatedAt(id, undefined);
    return withSimulation(findIntegration(id));
  },

  listSuggestedQuestions: (signal) => respond(() => suggestedQuestions, signal),

  async askAssistant({ question }, onEvent, signal) {
    const { steps, answer } = reason(question);

    await delay(240, signal);
    for (const step of steps) {
      onEvent({ type: 'step', step });
      await delay(230 + Math.random() * 220, signal);
    }

    // Stream the summary in small word groups, as a real model response would arrive.
    const tokens = answer.summary.match(/\S+\s*/g) ?? [];
    for (let i = 0; i < tokens.length; i += 2) {
      onEvent({ type: 'summary_delta', text: tokens.slice(i, i + 2).join('') });
      await delay(26, signal);
    }

    await delay(120, signal);
    onEvent({ type: 'answer', answer: structuredClone(answer) });
  },

  resetDemoState,
};
