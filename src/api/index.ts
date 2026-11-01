import type { OrgMindApi } from './contract';

/**
 * The one place that decides where data comes from.
 *
 * mock (default): sample data from src/mocks, no network requests.
 * http: real requests to the FastAPI backend.
 *
 * Both are dynamic imports behind a compile-time constant, so a build made with
 * VITE_API_MODE=http contains no sample data at all, and a demo build no HTTP client.
 */
export const api: OrgMindApi =
  import.meta.env.VITE_API_MODE === 'http'
    ? (await import('./http/httpApi')).httpApi
    : (await import('@/mocks/mockApi')).mockApi;

export const isDemoMode = api.mode === 'mock';

export type { OrgMindApi } from './contract';
export * from './types';
