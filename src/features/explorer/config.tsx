import type { Decision, OrgDirectory, Person, Project, Repository, Service, Team } from '@/api';
import { Avatar, EntityLink } from '@/components/domain/entity';
import {
  DecisionStatusLabel,
  ProjectStatusLabel,
  ServiceStatusLabel,
} from '@/components/domain/status';
import { Badge } from '@/components/ui/Badge';
import type { Column } from '@/components/ui/DataTable';
import { formatDate, timeAgo } from '@/lib/format';

export interface FilterDef<T> {
  /** URL parameter name. */
  key: string;
  label: string;
  options: { value: string; label: string }[];
  matches: (row: T, value: string) => boolean;
}

export interface ExplorerConfig<T> {
  rows: (directory: OrgDirectory) => T[];
  id: (row: T) => string;
  /** Text that the search box looks through. */
  searchText: (row: T, directory: OrgDirectory) => string;
  columns: Column<T>[];
  filters: (directory: OrgDirectory) => FilterDef<T>[];
  defaultSort: { columnId: string; direction: 'asc' | 'desc' };
}

const teamOptions = (directory: OrgDirectory) => directory.teams.map((t) => ({ value: t.id, label: t.name }));
const teamName = (directory: OrgDirectory, id: string) => directory.teams.find((t) => t.id === id)?.name ?? '';
const personName = (directory: OrgDirectory, id: string) => directory.people.find((p) => p.id === id)?.name ?? '';

/* Row link text is plain here because the whole row opens the same details. */
const PrimaryCell = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <span className="block min-w-0">
    <span className="block truncate font-medium text-ink">{title}</span>
    {subtitle && <span className="block truncate text-meta text-ink-3">{subtitle}</span>}
  </span>
);

export const peopleConfig: ExplorerConfig<Person> = {
  rows: (d) => d.people,
  id: (p) => p.id,
  searchText: (p, d) => `${p.name} ${p.role} ${p.location} ${teamName(d, p.teamId)} ${p.expertise.join(' ')}`,
  defaultSort: { columnId: 'name', direction: 'asc' },
  columns: [
    {
      id: 'name',
      header: 'Name',
      sortValue: (p) => p.name,
      className: 'max-w-[280px] max-sm:max-w-[calc(100vw-66px)]',
      cell: (p) => (
        <span className="flex min-w-0 items-center gap-2.5">
          <Avatar name={p.name} />
          <PrimaryCell title={p.name} subtitle={p.role} />
        </span>
      ),
    },
    { id: 'team', header: 'Team', hideBelow: 'sm', sortValue: (p) => p.teamId, cell: (p) => <EntityLink id={p.teamId} /> },
    { id: 'location', header: 'Location', hideBelow: 'lg', sortValue: (p) => p.location, cell: (p) => p.location },
    {
      id: 'expertise',
      header: 'Expertise',
      hideBelow: 'xl',
      cell: (p) => (
        <span className="flex gap-1">
          {p.expertise.slice(0, 2).map((skill) => (
            <Badge key={skill}>{skill}</Badge>
          ))}
          {p.expertise.length > 2 && <Badge>+{p.expertise.length - 2}</Badge>}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      hideBelow: 'md',
      sortValue: (p) => p.status,
      cell: (p) => (p.status === 'departing' && p.lastDayAt ? <Badge>Leaving {timeAgo(p.lastDayAt)}</Badge> : 'Active'),
    },
  ],
  filters: (d) => [
    { key: 'team', label: 'Team', options: teamOptions(d), matches: (p, v) => p.teamId === v },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'departing', label: 'Leaving' },
      ],
      matches: (p, v) => p.status === v,
    },
  ],
};

export function teamsConfig(directory: OrgDirectory): ExplorerConfig<Team> {
  const count = <T,>(rows: T[], matches: (row: T) => boolean) => rows.filter(matches).length;
  return {
    rows: (d) => d.teams,
    id: (t) => t.id,
    searchText: (t, d) => `${t.name} ${t.mission} ${personName(d, t.leadId)}`,
    defaultSort: { columnId: 'name', direction: 'asc' },
    columns: [
      { id: 'name', header: 'Team', sortValue: (t) => t.name, className: 'max-w-[440px] max-sm:max-w-[calc(100vw-66px)]', cell: (t) => <PrimaryCell title={t.name} subtitle={t.mission} /> },
      { id: 'lead', header: 'Lead', hideBelow: 'sm', sortValue: (t) => personName(directory, t.leadId), cell: (t) => <EntityLink id={t.leadId} /> },
      { id: 'members', header: 'People', align: 'right', hideBelow: 'md', sortValue: (t) => count(directory.people, (p) => p.teamId === t.id), cell: (t) => count(directory.people, (p) => p.teamId === t.id) },
      { id: 'services', header: 'Services', align: 'right', hideBelow: 'md', sortValue: (t) => count(directory.services, (s) => s.teamId === t.id), cell: (t) => count(directory.services, (s) => s.teamId === t.id) },
      { id: 'repos', header: 'Repositories', align: 'right', hideBelow: 'lg', sortValue: (t) => count(directory.repositories, (r) => r.teamId === t.id), cell: (t) => count(directory.repositories, (r) => r.teamId === t.id) },
      { id: 'projects', header: 'Projects', align: 'right', hideBelow: 'lg', sortValue: (t) => count(directory.projects, (p) => p.teamIds.includes(t.id)), cell: (t) => count(directory.projects, (p) => p.teamIds.includes(t.id)) },
    ],
    filters: () => [],
  };
}

export const projectsConfig: ExplorerConfig<Project> = {
  rows: (d) => d.projects,
  id: (p) => p.id,
  searchText: (p, d) => `${p.name} ${p.description} ${personName(d, p.leadId)}`,
  defaultSort: { columnId: 'target', direction: 'asc' },
  columns: [
    { id: 'name', header: 'Project', sortValue: (p) => p.name, className: 'max-w-[360px] max-sm:max-w-[calc(100vw-190px)]', cell: (p) => <PrimaryCell title={p.name} subtitle={p.description} /> },
    { id: 'status', header: 'Status', sortValue: (p) => p.status, cell: (p) => <ProjectStatusLabel status={p.status} /> },
    {
      id: 'progress',
      header: 'Progress',
      hideBelow: 'md',
      sortValue: (p) => p.progressPct,
      cell: (p) => (
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-3" aria-hidden>
            <span className="block h-full rounded-full bg-accent" style={{ width: `${p.progressPct}%` }} />
          </span>
          <span className="tabular text-meta">{p.progressPct}%</span>
        </span>
      ),
    },
    { id: 'lead', header: 'Lead', hideBelow: 'lg', sortValue: (p) => p.leadId, cell: (p) => <EntityLink id={p.leadId} /> },
    { id: 'target', header: 'Target', hideBelow: 'sm', sortValue: (p) => p.targetAt, cell: (p) => <span className="whitespace-nowrap">{formatDate(p.targetAt)}</span> },
  ],
  filters: (d) => [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'on_track', label: 'On track' },
        { value: 'at_risk', label: 'At risk' },
        { value: 'blocked', label: 'Blocked' },
        { value: 'completed', label: 'Completed' },
      ],
      matches: (p, v) => p.status === v,
    },
    { key: 'team', label: 'Team', options: teamOptions(d), matches: (p, v) => p.teamIds.includes(v) },
  ],
};

export const servicesConfig: ExplorerConfig<Service> = {
  rows: (d) => d.services,
  id: (s) => s.id,
  searchText: (s, d) => `${s.name} ${s.description} ${s.runtime} ${teamName(d, s.teamId)}`,
  defaultSort: { columnId: 'tier', direction: 'asc' },
  columns: [
    { id: 'name', header: 'Service', sortValue: (s) => s.name, className: 'max-w-[320px] max-sm:max-w-[calc(100vw-190px)]', cell: (s) => <PrimaryCell title={s.name} subtitle={s.description} /> },
    { id: 'status', header: 'Status', sortValue: (s) => s.status, cell: (s) => <ServiceStatusLabel status={s.status} /> },
    { id: 'tier', header: 'Tier', sortValue: (s) => s.tier, hideBelow: 'sm', cell: (s) => <span className="tabular">Tier {s.tier}</span> },
    { id: 'team', header: 'Team', hideBelow: 'lg', sortValue: (s) => s.teamId, cell: (s) => <EntityLink id={s.teamId} /> },
    { id: 'oncall', header: 'On call', hideBelow: 'xl', sortValue: (s) => s.onCallId, cell: (s) => <EntityLink id={s.onCallId} /> },
    { id: 'deploys', header: 'Deploys / wk', align: 'right', hideBelow: 'md', sortValue: (s) => s.deploysPerWeek, cell: (s) => s.deploysPerWeek },
    { id: 'p95', header: 'p95 ms', align: 'right', hideBelow: 'lg', sortValue: (s) => s.p95Ms, cell: (s) => s.p95Ms },
    { id: 'errors', header: 'Errors %', align: 'right', hideBelow: 'xl', sortValue: (s) => s.errorRatePct, cell: (s) => s.errorRatePct },
  ],
  filters: (d) => [
    { key: 'team', label: 'Team', options: teamOptions(d), matches: (s, v) => s.teamId === v },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'healthy', label: 'Healthy' },
        { value: 'degraded', label: 'Degraded' },
        { value: 'at_risk', label: 'At risk' },
      ],
      matches: (s, v) => s.status === v,
    },
    {
      key: 'tier',
      label: 'Tier',
      options: [
        { value: '0', label: 'Tier 0' },
        { value: '1', label: 'Tier 1' },
        { value: '2', label: 'Tier 2' },
      ],
      matches: (s, v) => String(s.tier) === v,
    },
  ],
};

export const repositoriesConfig: ExplorerConfig<Repository> = {
  rows: (d) => d.repositories,
  id: (r) => r.id,
  searchText: (r, d) => `${r.name} ${r.language} ${r.provider} ${teamName(d, r.teamId)} ${personName(d, r.topContributorId)}`,
  defaultSort: { columnId: 'bus', direction: 'asc' },
  columns: [
    { id: 'name', header: 'Repository', sortValue: (r) => r.name, className: 'max-sm:max-w-[calc(100vw-190px)]', cell: (r) => <PrimaryCell title={r.name} subtitle={`${r.provider} · ${r.language}`} /> },
    { id: 'team', header: 'Team', hideBelow: 'lg', sortValue: (r) => r.teamId, cell: (r) => <EntityLink id={r.teamId} /> },
    {
      id: 'top',
      header: 'Top contributor',
      hideBelow: 'md',
      sortValue: (r) => r.topContributorSharePct,
      cell: (r) => (
        <span className="flex items-center gap-1.5">
          <EntityLink id={r.topContributorId} glyph={false} />
          <span className="tabular text-meta text-ink-3">{r.topContributorSharePct}%</span>
        </span>
      ),
    },
    { id: 'bus', header: 'Bus factor', align: 'right', sortValue: (r) => r.busFactor, cell: (r) => r.busFactor },
    { id: 'coverage', header: 'Coverage', align: 'right', hideBelow: 'sm', sortValue: (r) => r.coveragePct, cell: (r) => (r.coveragePct === null ? '–' : `${r.coveragePct}%`) },
    { id: 'prs', header: 'Open PRs', align: 'right', hideBelow: 'xl', sortValue: (r) => r.openPullRequests, cell: (r) => r.openPullRequests },
    { id: 'commit', header: 'Last commit', align: 'right', hideBelow: 'xl', sortValue: (r) => r.lastCommitAt, cell: (r) => timeAgo(r.lastCommitAt) },
  ],
  filters: (d) => [
    { key: 'team', label: 'Team', options: teamOptions(d), matches: (r, v) => r.teamId === v },
    {
      key: 'provider',
      label: 'Provider',
      options: [
        { value: 'GitHub', label: 'GitHub' },
        { value: 'GitLab', label: 'GitLab' },
      ],
      matches: (r, v) => r.provider === v,
    },
    {
      key: 'risk',
      label: 'Bus factor',
      options: [
        { value: '1', label: 'Bus factor of 1' },
        { value: '2', label: 'Bus factor of 2' },
        { value: '3', label: 'Bus factor of 3' },
      ],
      matches: (r, v) => String(r.busFactor) === v,
    },
  ],
};

export const decisionsConfig: ExplorerConfig<Decision> = {
  rows: (d) => d.decisions,
  id: (d) => d.id,
  searchText: (d) => `${d.code} ${d.title} ${d.context} ${d.outcome}`,
  defaultSort: { columnId: 'date', direction: 'desc' },
  columns: [
    {
      id: 'title',
      header: 'Decision',
      sortValue: (d) => d.code,
      className: 'max-w-[460px] max-sm:max-w-[calc(100vw-190px)]',
      cell: (d) => <PrimaryCell title={d.title} subtitle={d.code} />,
    },
    { id: 'status', header: 'Status', sortValue: (d) => d.status, cell: (d) => <DecisionStatusLabel status={d.status} /> },
    { id: 'author', header: 'Lead author', hideBelow: 'lg', sortValue: (d) => d.authorIds[0], cell: (d) => <EntityLink id={d.authorIds[0]} /> },
    { id: 'source', header: 'Source', hideBelow: 'xl', sortValue: (d) => d.source, cell: (d) => d.source },
    { id: 'date', header: 'Decided', hideBelow: 'md', sortValue: (d) => d.decidedAt, cell: (d) => <span className="whitespace-nowrap">{formatDate(d.decidedAt)}</span> },
  ],
  filters: () => [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'accepted', label: 'Accepted' },
        { value: 'proposed', label: 'Proposed' },
        { value: 'superseded', label: 'Superseded' },
      ],
      matches: (d, v) => d.status === v,
    },
  ],
};
