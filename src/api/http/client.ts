const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1';

export class ApiError extends Error {
  readonly status: number;
  readonly detail?: string;

  constructor(status: number, message: string, detail?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

export function apiUrl(path: string): string {
  return `${BASE_URL}${path}`;
}

/** Reads FastAPI's `{ "detail": ... }` error body when one is present. */
async function readErrorDetail(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as { detail?: unknown };
    return typeof body.detail === 'string' ? body.detail : undefined;
  } catch {
    return undefined;
  }
}

export async function assertOk(response: Response): Promise<void> {
  if (response.ok) return;
  const detail = await readErrorDetail(response);
  const fallback =
    response.status >= 500
      ? `The OrgMind API is unavailable (status ${response.status}). Check that the backend is running.`
      : `The request failed with status ${response.status}.`;
  throw new ApiError(response.status, detail ?? fallback, detail);
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options;

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      method,
      signal,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'Could not reach the OrgMind API. Check that the backend is running.');
  }

  await assertOk(response);
  if (response.status === 204) return undefined as T;

  try {
    return (await response.json()) as T;
  } catch {
    // A dev proxy with no backend behind it can answer 200 with HTML.
    throw new ApiError(response.status, 'The OrgMind API returned a response that was not JSON.');
  }
}
