import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';
import { isDemoMode, type OrgDirectory } from '@/api';
import { Badge } from '@/components/ui/Badge';
import { useInsights } from '@/hooks/useInsights';
import { useOrgData } from '@/hooks/useOrgData';
import { cn } from '@/lib/cn';
import { findEntity, type EntityRecord } from '@/lib/directory';
import { formatDate, timeAgo } from '@/lib/format';
import { relationsOf } from '@/lib/graph';
import { EntityGlyph, EntityLink } from './entity';
import { DecisionStatusLabel, ProjectStatusLabel, SEVERITY_META, ServiceStatusLabel } from './status';

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-3 py-1.5">
      <dt className="text-ui text-ink-3">{label}</dt>
      <dd className="min-w-0 text-ui text-ink">{children}</dd>
    </div>
  );
}

function Prose({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="text-meta font-medium text-ink-3">{title}</h3>
      <div className="mt-1 text-ui text-ink-2">{children}</div>
    </div>
  );
}

const Chips = ({ items }: { items: string[] }) => (
  <span className="flex flex-wrap gap-1">
    {items.map((item) => (
      <Badge key={item}>{item}</Badge>
    ))}
  </span>
);

function Stack({ ids }: { ids: string[] }) {
  return (
    <span className="flex flex-col items-start gap-0.5">
      {ids.map((id) => (
        <EntityLink key={id} id={id} />
      ))}
    </span>
  );
}

function ProgressValue({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-3" aria-hidden>
        <span className="block h-full rounded-full bg-accent" style={{ width: `${value}%` }} />
      </span>
      <span className="tabular">{value}%</span>
    </span>
  );
}

/** The key properties of any entity, laid out the same way everywhere. */
export function EntityFacts({ entity, directory }: { entity: EntityRecord; directory: OrgDirectory }) {
  switch (entity.type) {
    case 'person': {
      const p = entity.record;
      return (
        <>
          {p.status === 'departing' && p.lastDayAt && (
            <p className="mb-2 flex items-start gap-2 rounded-md border border-line-strong bg-surface-2 p-2.5 text-ui text-ink">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-serious" aria-hidden />
              Last day is {formatDate(p.lastDayAt)} ({timeAgo(p.lastDayAt)})
            </p>
          )}
          <dl>
            <Fact label="Role">{p.role}</Fact>
            <Fact label="Team"><EntityLink id={p.teamId} /></Fact>
            <Fact label="Location">{p.location}</Fact>
            <Fact label="Email"><span className="break-all">{p.email}</span></Fact>
            <Fact label="Joined">{formatDate(p.startedAt)}</Fact>
            <Fact label="Expertise"><Chips items={p.expertise} /></Fact>
          </dl>
        </>
      );
    }
    case 'team': {
      const t = entity.record;
      const members = directory.people.filter((p) => p.teamId === t.id).length;
      return (
        <>
          <p className="mb-2 text-ui text-ink-2">{t.mission}</p>
          <dl>
            <Fact label="Lead"><EntityLink id={t.leadId} /></Fact>
            <Fact label="Channel">{t.channel}</Fact>
            <Fact label="Members">{members}</Fact>
            <Fact label="Services">{directory.services.filter((s) => s.teamId === t.id).length}</Fact>
            <Fact label="Repositories">{directory.repositories.filter((r) => r.teamId === t.id).length}</Fact>
          </dl>
        </>
      );
    }
    case 'project': {
      const p = entity.record;
      return (
        <>
          <p className="mb-2 text-ui text-ink-2">{p.description}</p>
          <dl>
            <Fact label="Status"><ProjectStatusLabel status={p.status} /></Fact>
            <Fact label="Progress"><ProgressValue value={p.progressPct} /></Fact>
            <Fact label="Lead"><EntityLink id={p.leadId} /></Fact>
            <Fact label="Target">{formatDate(p.targetAt)} ({timeAgo(p.targetAt)})</Fact>
            <Fact label="Started">{formatDate(p.startedAt)}</Fact>
          </dl>
          <Prose title="Latest status">{p.statusNote}</Prose>
        </>
      );
    }
    case 'service': {
      const s = entity.record;
      return (
        <>
          <p className="mb-2 text-ui text-ink-2">{s.description}</p>
          <dl>
            <Fact label="Status"><ServiceStatusLabel status={s.status} /></Fact>
            <Fact label="Tier">Tier {s.tier}{s.tier === 0 ? ', business critical' : ''}</Fact>
            <Fact label="Runtime">{s.runtime}</Fact>
            <Fact label="Team"><EntityLink id={s.teamId} /></Fact>
            <Fact label="On call"><EntityLink id={s.onCallId} /></Fact>
            <Fact label="Repository"><EntityLink id={s.repositoryId} /></Fact>
            <Fact label="Deploys">{s.deploysPerWeek} per week, last {timeAgo(s.lastDeployAt)}</Fact>
            <Fact label="p95 latency"><span className="tabular">{s.p95Ms} ms</span></Fact>
            <Fact label="Error rate"><span className="tabular">{s.errorRatePct}%</span></Fact>
            <Fact label="Docs updated">{timeAgo(s.docsUpdatedAt)}</Fact>
          </dl>
        </>
      );
    }
    case 'repository': {
      const r = entity.record;
      return (
        <dl>
          <Fact label="Provider">{r.provider}</Fact>
          <Fact label="Language">{r.language}</Fact>
          <Fact label="Team"><EntityLink id={r.teamId} /></Fact>
          <Fact label="Top contributor">
            <span className="flex flex-wrap items-center gap-x-1.5">
              <EntityLink id={r.topContributorId} />
              <span className="tabular text-ink-3">{r.topContributorSharePct}% of commits</span>
            </span>
          </Fact>
          <Fact label="Bus factor"><span className="tabular">{r.busFactor}</span></Fact>
          <Fact label="Coverage"><span className="tabular">{r.coveragePct === null ? 'Not applicable' : `${r.coveragePct}%`}</span></Fact>
          <Fact label="Open PRs"><span className="tabular">{r.openPullRequests}</span></Fact>
          <Fact label="Size"><span className="tabular">{r.sizeKloc} kloc</span></Fact>
          <Fact label="Last commit">{timeAgo(r.lastCommitAt)}</Fact>
        </dl>
      );
    }
    case 'decision': {
      const d = entity.record;
      return (
        <>
          <dl>
            <Fact label="Status"><DecisionStatusLabel status={d.status} /></Fact>
            <Fact label="Decided">{formatDate(d.decidedAt)}</Fact>
            <Fact label="Authors"><Stack ids={d.authorIds} /></Fact>
            <Fact label="Source">{d.source}</Fact>
            {d.supersededById && <Fact label="Superseded by"><EntityLink id={d.supersededById} /></Fact>}
          </dl>
          <Prose title="Context">{d.context}</Prose>
          <Prose title="Outcome">{d.outcome}</Prose>
          <Prose title="Alternatives considered">
            <ul className="list-disc pl-4">
              {d.alternatives.map((alternative) => (
                <li key={alternative}>{alternative}</li>
              ))}
            </ul>
          </Prose>
        </>
      );
    }
  }
}

/** Relationships from the knowledge graph, grouped as they read from this entity. */
export function RelationshipGroups({ id, onSelect }: { id: string; onSelect: (nodeId: string) => void }) {
  const { index } = useOrgData();
  const groups = useMemo(() => (index ? relationsOf(index, id) : []), [index, id]);

  if (groups.length === 0) return <p className="text-ui text-ink-3">No relationships in the graph.</p>;

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div key={group.key}>
          <h4 className="mb-0.5 flex items-baseline gap-1.5 text-meta font-medium text-ink-3">
            {group.label}
            <span className="tabular font-normal">{group.relations.length}</span>
          </h4>
          <ul>
            {group.relations.map(({ node }) => (
              <li key={node.id}>
                <button
                  type="button"
                  onClick={() => onSelect(node.id)}
                  className="-mx-1.5 flex w-[calc(100%+12px)] items-center gap-2 rounded px-1.5 py-1 text-left text-ui text-ink-2 transition-colors duration-75 hover:bg-surface-2 hover:text-ink"
                >
                  <EntityGlyph type={node.type} />
                  <span className="truncate">{node.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Findings that involve this entity. */
export function RelatedFindings({ id, onNavigate, className }: { id: string; onNavigate?: () => void; className?: string }) {
  const { insights } = useInsights();
  const related = useMemo(
    () =>
      (insights ?? [])
        .filter((insight) => insight.entityIds.includes(id) && insight.status !== 'resolved' && insight.status !== 'dismissed')
        .sort((a, b) => SEVERITY_META[a.severity].order - SEVERITY_META[b.severity].order),
    [insights, id],
  );

  if (related.length === 0) return null;

  return (
    <div className={className}>
      <h3 className="mb-1 text-meta font-medium text-ink-3">Findings {isDemoMode ? '(sample)' : ''}</h3>
      <ul>
        {related.map((insight) => {
          const meta = SEVERITY_META[insight.severity];
          const Icon = meta.icon;
          return (
            <li key={insight.id}>
              <Link
                to={`/intelligence?finding=${insight.id}`}
                onClick={onNavigate}
                className="-mx-1.5 flex gap-2 rounded px-1.5 py-1 text-ui text-ink-2 transition-colors duration-75 hover:bg-surface-2 hover:text-ink"
              >
                <Icon className={cn('mt-0.5 size-3.5 shrink-0', meta.color)} aria-label={meta.label} />
                <span>{insight.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function useEntity(id: string | undefined) {
  const { directory } = useOrgData();
  return useMemo(() => (directory && id ? findEntity(directory, id) : undefined), [directory, id]);
}
