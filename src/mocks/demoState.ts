import type { Insight, InsightStatus, IntegrationId } from '@/api/types';
import { insights } from './data';

/**
 * Changes made in the demo UI: finding statuses and simulated integrations. They live in
 * localStorage, which is why a refresh keeps them, and both the API and the reasoner read
 * them from here so that the two can never disagree.
 */

const STORAGE_KEY = 'orgmind.demo.v1';

interface DemoState {
  insightStatus: Partial<Record<string, InsightStatus>>;
  simulated: Partial<Record<IntegrationId, string>>;
}

const INSIGHT_STATUSES: readonly unknown[] = ['open', 'acknowledged', 'resolved', 'dismissed'] satisfies InsightStatus[];

/** The entries of a stored object that pass `isValid`, or nothing if it is not an object at all. */
function validEntries(value: unknown, isValid: (entry: unknown) => boolean) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => isValid(entry)));
}

function loadState(): DemoState {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Record<keyof DemoState, unknown>> | null;
    return {
      insightStatus: validEntries(stored?.insightStatus, (status) => INSIGHT_STATUSES.includes(status)),
      simulated: validEntries(stored?.simulated, (at) => typeof at === 'string' && !Number.isNaN(Date.parse(at))),
    };
  } catch {
    // Storage may be blocked or hold invalid data. The demo works without it.
    return { insightStatus: {}, simulated: {} };
  }
}

let state = loadState();

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Non-fatal: changes last until the page is reloaded.
  }
}

export function currentInsights(): Insight[] {
  return insights.map((insight) => ({ ...insight, status: state.insightStatus[insight.id] ?? insight.status }));
}

export function setInsightStatus(id: string, status: InsightStatus) {
  state.insightStatus[id] = status;
  saveState();
}

export function simulatedAt(id: IntegrationId): string | undefined {
  return state.simulated[id];
}

export function setSimulatedAt(id: IntegrationId, at: string | undefined) {
  if (at) state.simulated[id] = at;
  else delete state.simulated[id];
  saveState();
}

export function resetDemoState() {
  state = { insightStatus: {}, simulated: {} };
  saveState();
}
