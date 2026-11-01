import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { api, type GraphNode, type KnowledgeGraph, type OrgDirectory } from '@/api';
import { buildGraphIndex, type GraphIndex } from '@/lib/graph';
import { useResource } from './useResource';

interface OrgData {
  directory?: OrgDirectory;
  graph?: KnowledgeGraph;
  index?: GraphIndex;
  loading: boolean;
  error: unknown;
  retry: () => void;
  /** Resolve an id to its type and display name. */
  node: (id: string) => GraphNode | undefined;
}

const OrgDataContext = createContext<OrgData | null>(null);

/**
 * Directory and graph are loaded once for the whole app, because links, search and
 * detail views all need to resolve ids to names.
 */
export function OrgDataProvider({ children }: { children: ReactNode }) {
  const directory = useResource((signal) => api.getDirectory(signal));
  const graph = useResource((signal) => api.getGraph(signal));

  const index = useMemo(() => (graph.data ? buildGraphIndex(graph.data) : undefined), [graph.data]);

  const value = useMemo<OrgData>(
    () => ({
      directory: directory.data,
      graph: graph.data,
      index,
      loading: directory.loading || graph.loading,
      error: directory.error ?? graph.error,
      retry: () => {
        directory.refetch();
        graph.refetch();
      },
      node: (id) => index?.nodeById.get(id),
    }),
    [directory.data, directory.loading, directory.error, directory.refetch, graph.data, graph.loading, graph.error, graph.refetch, index],
  );

  return <OrgDataContext.Provider value={value}>{children}</OrgDataContext.Provider>;
}

export function useOrgData() {
  const context = useContext(OrgDataContext);
  if (!context) throw new Error('useOrgData must be used within OrgDataProvider');
  return context;
}
