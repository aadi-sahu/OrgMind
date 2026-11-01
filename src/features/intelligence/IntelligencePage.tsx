import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchX, ShieldCheck } from 'lucide-react';
import { isDemoMode, type Insight, type InsightCategory, type InsightStatus, type Severity } from '@/api';
import { INSIGHT_STATUS, SEVERITY_META, SeverityLabel } from '@/components/domain/status';
import { SampleTag } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Menu';
import { PageContainer, PageHeader, Panel } from '@/components/ui/Panel';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { Tabs } from '@/components/ui/Tabs';
import { useInsights } from '@/hooks/useInsights';
import { useOrgData } from '@/hooks/useOrgData';
import { useSearchParamInput } from '@/hooks/useSearchParamInput';
import { cn } from '@/lib/cn';
import { timeAgo } from '@/lib/format';
import { FindingDrawer } from './FindingDrawer';
import { CATEGORIES, CATEGORY_META } from './meta';

const ALL = 'all';
const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low'];

/** By default the list hides findings that no longer need action. */
const ACTIVE = 'active';
type StatusFilter = typeof ACTIVE | typeof ALL | InsightStatus;

type SortKey = 'severity' | 'recent' | 'confidence';

const SORTERS: Record<SortKey, (a: Insight, b: Insight) => number> = {
  severity: (a, b) => SEVERITY_META[a.severity].order - SEVERITY_META[b.severity].order || b.detectedAt.localeCompare(a.detectedAt),
  recent: (a, b) => b.detectedAt.localeCompare(a.detectedAt),
  confidence: (a, b) => b.confidence - a.confidence,
};

const CATEGORY_FILTERS: (InsightCategory | typeof ALL)[] = [ALL, ...CATEGORIES];
const SEVERITY_FILTERS: (Severity | typeof ALL)[] = [ALL, ...SEVERITIES];
const STATUS_FILTERS: StatusFilter[] = [ACTIVE, ALL, 'open', 'acknowledged', 'resolved', 'dismissed'];
const SORT_KEYS: SortKey[] = ['severity', 'recent', 'confidence'];

/** A URL can hold anything, so only known values are used. */
function oneOf<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function matchesStatus(insight: Insight, status: StatusFilter): boolean {
  if (status === ALL) return true;
  if (status === ACTIVE) return insight.status === 'open' || insight.status === 'acknowledged';
  return insight.status === status;
}

function FindingRow({ insight, onOpen }: { insight: Insight; onOpen: () => void }) {
  const { node } = useOrgData();
  const category = CATEGORY_META[insight.category];
  const CategoryIcon = category.icon;
  const closed = insight.status === 'resolved' || insight.status === 'dismissed';

  return (
    <li className="border-b border-line last:border-b-0">
      <button
        type="button"
        onClick={onOpen}
        className="grid w-full grid-cols-[1fr_auto] gap-x-4 gap-y-1 px-4 py-3.5 text-left transition-colors duration-75 hover:bg-surface-2 focus-visible:-outline-offset-2 md:grid-cols-[96px_1fr_auto]"
      >
        <SeverityLabel severity={insight.severity} className="self-start md:mt-px" />
        <span className="col-span-2 min-w-0 md:col-span-1 md:row-span-2">
          <span className={cn('block text-ui font-medium', closed ? 'text-ink-2' : 'text-ink')}>{insight.title}</span>
          <span className="mt-0.5 line-clamp-2 block text-ui text-ink-2">{insight.summary}</span>
          <span className="mt-1.5 flex flex-wrap items-center gap-x-2 text-meta text-ink-3">
            <span className="inline-flex items-center gap-1">
              <CategoryIcon className="size-3" aria-hidden />
              {category.label}
            </span>
            <span>· {node(insight.ownerTeamId)?.name}</span>
            <span>· {Math.round(insight.confidence * 100)}% confidence</span>
            {insight.status !== 'open' && <span>· {INSIGHT_STATUS[insight.status].label}</span>}
          </span>
        </span>
        <time dateTime={insight.detectedAt} className="tabular col-start-2 row-start-1 text-right text-meta text-ink-3 md:col-start-3">
          {timeAgo(insight.detectedAt)}
        </time>
      </button>
    </li>
  );
}

export default function IntelligencePage() {
  const { insights, loading, error, retry } = useInsights();
  const [params, setParams] = useSearchParams();

  const category = oneOf(params.get('category'), CATEGORY_FILTERS, ALL);
  const severity = oneOf(params.get('severity'), SEVERITY_FILTERS, ALL);
  const status = oneOf(params.get('status'), STATUS_FILTERS, ACTIVE);
  const sort = oneOf(params.get('sort'), SORT_KEYS, 'severity');
  const [query, setQuery] = useSearchParamInput('q');
  const findingId = params.get('finding');

  const setParam = (key: string, value: string, fallback = ALL) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value && value !== fallback) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  };

  const all = useMemo(() => insights ?? [], [insights]);

  // Tab counts respect every filter except the category itself.
  const beforeCategory = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter(
      (insight) =>
        matchesStatus(insight, status) &&
        (severity === ALL || insight.severity === severity) &&
        (!q || `${insight.title} ${insight.summary}`.toLowerCase().includes(q)),
    );
  }, [all, status, severity, query]);

  const rows = useMemo(
    () =>
      beforeCategory
        .filter((insight) => category === ALL || insight.category === category)
        .sort(SORTERS[sort]),
    [beforeCategory, category, sort],
  );

  const open = all.filter((insight) => insight.status === 'open');
  const selected = findingId ? all.find((insight) => insight.id === findingId) : undefined;
  const isFiltered = severity !== ALL || status !== ACTIVE || Boolean(query);

  return (
    <PageContainer>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            Proactive Intelligence
            {isDemoMode && <SampleTag />}
          </span>
        }
        description="Problems OrgMind found by continuously analyzing the organization, before anyone asked."
      />

      {/* Severity summary doubles as a filter */}
      <div className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-4">
        {SEVERITIES.map((level) => {
          const meta = SEVERITY_META[level];
          const Icon = meta.icon;
          const count = open.filter((insight) => insight.severity === level).length;
          const active = severity === level;
          return (
            <button
              key={level}
              type="button"
              aria-pressed={active}
              onClick={() => setParam('severity', active ? ALL : level)}
              className={cn(
                'bg-surface px-4 py-3 text-left transition-colors duration-100 hover:bg-surface-2 focus-visible:-outline-offset-2',
                active && 'bg-surface-3 hover:bg-surface-3',
              )}
            >
              <span className="flex items-center gap-1.5 text-ui text-ink-2">
                <Icon className={cn('size-3.5', meta.color)} aria-hidden />
                {meta.label}
              </span>
              <span className="mt-1 block text-stat font-semibold tracking-[-0.02em] text-ink">
                {loading ? <Skeleton className="h-8 w-8" /> : count}
              </span>
              <span className="block text-meta text-ink-3">open</span>
            </button>
          );
        })}
      </div>

      <Tabs
        label="Finding category"
        value={category}
        onChange={(value) => setParam('category', value)}
        items={[
          { value: ALL as InsightCategory | typeof ALL, label: 'All', count: insights ? beforeCategory.length : undefined },
          ...CATEGORIES.map((value) => {
            const Icon = CATEGORY_META[value].icon;
            return {
              value: value as InsightCategory | typeof ALL,
              label: CATEGORY_META[value].label,
              icon: <Icon className="size-3.5" aria-hidden />,
              count: insights ? beforeCategory.filter((insight) => insight.category === value).length : undefined,
            };
          }),
        ]}
        className="mb-3"
      />

      {category !== ALL && <p className="mb-3 text-ui text-ink-2">{CATEGORY_META[category].description}.</p>}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchInput
          label="Search findings"
          placeholder="Search findings"
          value={query}
          onChange={setQuery}
          containerClassName="w-full sm:w-64"
        />
        <Select<Severity | typeof ALL>
          label="Filter by severity"
          value={severity}
          onChange={(value) => setParam('severity', value)}
          options={[{ value: ALL, label: 'All severities' }, ...SEVERITIES.map((value) => ({ value, label: SEVERITY_META[value].label }))]}
        />
        <Select<StatusFilter>
          label="Filter by status"
          value={status}
          onChange={(value) => setParam('status', value, ACTIVE)}
          options={[
            { value: ACTIVE, label: 'Needs action' },
            { value: ALL, label: 'All statuses' },
            { value: 'open', label: 'Open' },
            { value: 'acknowledged', label: 'Acknowledged' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'dismissed', label: 'Dismissed' },
          ]}
        />
        <Select<SortKey>
          label="Sort findings"
          prefix="Sort:"
          value={sort}
          onChange={(value) => setParam('sort', value, 'severity')}
          options={[
            { value: 'severity', label: 'Severity' },
            { value: 'recent', label: 'Most recent' },
            { value: 'confidence', label: 'Confidence' },
          ]}
        />
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('');
              setParams(
                (current) => {
                  const next = new URLSearchParams();
                  const keep = current.get('category');
                  if (keep) next.set('category', keep);
                  return next;
                },
                { replace: true },
              );
            }}
          >
            Clear
          </Button>
        )}
        <p className="tabular ml-auto text-meta text-ink-3" aria-live="polite">
          {insights ? `${rows.length} ${rows.length === 1 ? 'finding' : 'findings'}` : ''}
        </p>
      </div>

      <Panel>
        {error ? (
          <ErrorState error={error} onRetry={retry} />
        ) : loading ? (
          <div className="space-y-5 p-4" role="status" aria-label="Loading findings">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="mt-2 h-3.5 w-full" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          isFiltered || category !== ALL ? (
            <EmptyState
              icon={<SearchX className="size-4" aria-hidden />}
              title="No findings match"
              description="Try a different category, search or status."
            />
          ) : (
            <EmptyState
              icon={<ShieldCheck className="size-4 text-good" aria-hidden />}
              title="Nothing needs action"
              description="OrgMind keeps watching and will surface new findings here."
            />
          )
        ) : (
          <ul>
            {rows.map((insight) => (
              <FindingRow key={insight.id} insight={insight} onOpen={() => setParam('finding', insight.id, '')} />
            ))}
          </ul>
        )}
      </Panel>

      {selected && <FindingDrawer key={selected.id} insight={selected} onClose={() => setParam('finding', '', '')} />}
    </PageContainer>
  );
}
