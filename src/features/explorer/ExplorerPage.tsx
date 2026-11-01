import { useMemo } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { isDemoMode, type EntityType, type OrgDirectory } from '@/api';
import { EntityGlyph } from '@/components/domain/entity';
import { SampleTag } from '@/components/ui/Badge';
import { PageContainer, PageHeader, Panel } from '@/components/ui/Panel';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { Tabs } from '@/components/ui/Tabs';
import { useOrgData } from '@/hooks/useOrgData';
import { ENTITY_META, ENTITY_TYPES, explorerPath, segmentToType } from '@/lib/entities';
import {
  decisionsConfig,
  peopleConfig,
  projectsConfig,
  repositoriesConfig,
  servicesConfig,
  teamsConfig,
} from './config';
import { EntityDrawer } from './EntityDrawer';
import { EntityTable } from './EntityTable';

function TableFor({ type, directory }: { type: EntityType; directory: OrgDirectory }) {
  const teams = useMemo(() => teamsConfig(directory), [directory]);
  // Keyed by type: each table keeps its own sort and search state instead of inheriting another's.
  switch (type) {
    case 'person':
      return <EntityTable key={type} type={type} config={peopleConfig} directory={directory} />;
    case 'team':
      return <EntityTable key={type} type={type} config={teams} directory={directory} />;
    case 'project':
      return <EntityTable key={type} type={type} config={projectsConfig} directory={directory} />;
    case 'service':
      return <EntityTable key={type} type={type} config={servicesConfig} directory={directory} />;
    case 'repository':
      return <EntityTable key={type} type={type} config={repositoriesConfig} directory={directory} />;
    case 'decision':
      return <EntityTable key={type} type={type} config={decisionsConfig} directory={directory} />;
  }
}

function counts(directory: OrgDirectory | undefined, type: EntityType): number | undefined {
  if (!directory) return undefined;
  const lists: Record<EntityType, unknown[]> = {
    person: directory.people,
    team: directory.teams,
    project: directory.projects,
    service: directory.services,
    repository: directory.repositories,
    decision: directory.decisions,
  };
  return lists[type].length;
}

export default function ExplorerPage() {
  const { segment, id } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { directory, loading, error, retry } = useOrgData();

  const type = segmentToType(segment);
  if (!type) return <Navigate to={explorerPath('person')} replace />;

  return (
    <PageContainer>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            Organization Explorer
            {isDemoMode && <SampleTag />}
          </span>
        }
        description="Search everything OrgMind knows about your people, teams, projects, systems and decisions."
      />

      <Tabs
        label="Entity type"
        value={type}
        onChange={(next) => navigate(explorerPath(next))}
        items={ENTITY_TYPES.map((t) => ({
          value: t,
          label: ENTITY_META[t].plural,
          icon: <EntityGlyph type={t} />,
          count: counts(directory, t),
        }))}
        className="mb-4"
      />

      {error ? (
        <Panel>
          <ErrorState error={error} onRetry={retry} />
        </Panel>
      ) : loading || !directory ? (
        <div role="status" aria-label="Loading organization data">
          <Skeleton className="mb-3 h-8 w-64" />
          <Panel className="space-y-3 p-4">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </Panel>
        </div>
      ) : (
        <>
          <TableFor type={type} directory={directory} />
          {id && (
            <EntityDrawer
              key={id}
              id={id}
              directory={directory}
              onClose={() => navigate({ pathname: explorerPath(type), search: params.toString() })}
            />
          )}
        </>
      )}
    </PageContainer>
  );
}
