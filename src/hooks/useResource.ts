import { useCallback, useEffect, useRef, useState } from 'react';

export interface Resource<T> {
  data: T | undefined;
  error: unknown;
  /** True only while there is no data to show yet. */
  loading: boolean;
  /** True during any request, including a refetch that keeps old data on screen. */
  fetching: boolean;
  refetch: () => void;
  /** Update local data after a mutation, without another request. */
  setData: (update: (current: T | undefined) => T | undefined) => void;
}

/**
 * Loads data from the API with cancellation and retry. `fetcher` is expected to be
 * stable, and a change to `key` triggers a new request.
 */
export function useResource<T>(fetcher: (signal: AbortSignal) => Promise<T>, key = ''): Resource<T> {
  const [data, setDataState] = useState<T>();
  const [error, setError] = useState<unknown>();
  const [fetching, setFetching] = useState(true);
  const [attempt, setAttempt] = useState(0);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const controller = new AbortController();
    setFetching(true);
    setError(undefined);

    fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setDataState(result);
        setFetching(false);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setError(reason);
        setFetching(false);
      });

    return () => controller.abort();
  }, [key, attempt]);

  const refetch = useCallback(() => setAttempt((n) => n + 1), []);
  const setData = useCallback((update: (current: T | undefined) => T | undefined) => setDataState(update), []);

  return { data, error, loading: fetching && data === undefined, fetching, refetch, setData };
}
