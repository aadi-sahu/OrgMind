import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { api, type Insight, type InsightStatus } from '@/api';
import { SEVERITY_META } from '@/components/domain/status';
import { useResource } from './useResource';

interface InsightsContextValue {
  insights?: Insight[];
  loading: boolean;
  error: unknown;
  retry: () => void;
  updateStatus: (id: string, status: InsightStatus) => Promise<void>;
  /** Open critical and high findings, most severe first. */
  alerts: Insight[];
}

const InsightsContext = createContext<InsightsContextValue | null>(null);

/** Shared so that the notification bell, dashboard and Intelligence page always agree. */
export function InsightsProvider({ children }: { children: ReactNode }) {
  const { data, loading, error, refetch, setData } = useResource((signal) => api.listInsights(signal));

  const updateStatus = useCallback(
    async (id: string, status: InsightStatus) => {
      const updated = await api.updateInsightStatus(id, status);
      setData((current) => current?.map((insight) => (insight.id === id ? updated : insight)));
    },
    [setData],
  );

  const value = useMemo<InsightsContextValue>(() => {
    const alerts = (data ?? [])
      .filter((insight) => insight.status === 'open' && (insight.severity === 'critical' || insight.severity === 'high'))
      .sort(
        (a, b) =>
          SEVERITY_META[a.severity].order - SEVERITY_META[b.severity].order ||
          b.detectedAt.localeCompare(a.detectedAt),
      );
    return { insights: data, loading, error, retry: refetch, updateStatus, alerts };
  }, [data, loading, error, refetch, updateStatus]);

  return <InsightsContext.Provider value={value}>{children}</InsightsContext.Provider>;
}

export function useInsights() {
  const context = useContext(InsightsContext);
  if (!context) throw new Error('useInsights must be used within InsightsProvider');
  return context;
}
