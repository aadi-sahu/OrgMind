import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { HealthFactor, OrgHealth } from '@/api';
import { Sparkline } from '@/components/charts/TrendChart';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { Skeleton } from '@/components/ui/States';
import { cn } from '@/lib/cn';
import { signed } from '@/lib/format';

function band(score: number) {
  if (score >= 75) return { fill: 'bg-good', label: 'Good' };
  if (score >= 60) return { fill: 'bg-warning', label: 'Needs attention' };
  return { fill: 'bg-critical', label: 'At risk' };
}

function FactorRow({ factor }: { factor: HealthFactor }) {
  const { fill, label } = band(factor.score);
  return (
    <li>
      <Link
        to={`/intelligence?category=${factor.category}`}
        title={factor.explanation}
        aria-label={`${factor.label}: ${factor.score} out of 100, ${label}. ${factor.explanation}`}
        className="group -mx-2 grid grid-cols-[minmax(0,1fr)_64px_24px_30px] items-center gap-3 rounded px-2 py-1.5 transition-colors duration-100 hover:bg-surface-2 sm:grid-cols-[minmax(0,1fr)_96px_24px_30px]"
      >
        <span className="truncate text-ui text-ink-2 group-hover:text-ink">{factor.label}</span>
        <span className="h-1.5 overflow-hidden rounded-full bg-surface-3" aria-hidden>
          <span className={cn('block h-full rounded-full', fill)} style={{ width: `${factor.score}%` }} />
        </span>
        <span className="tabular text-right text-ui font-medium text-ink">{factor.score}</span>
        <span className="tabular text-right text-meta text-ink-3">{signed(factor.delta)}</span>
      </Link>
    </li>
  );
}

export function HealthPanel({ health, className }: { health?: OrgHealth; className?: string }) {
  if (!health) {
    return (
      <Panel className={cn('p-4', className)}>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-5 h-14 w-28" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </Panel>
    );
  }

  const lowest = [...health.factors].sort((a, b) => a.score - b.score)[0];
  const DeltaIcon = health.delta > 0 ? ArrowUpRight : health.delta < 0 ? ArrowDownRight : Minus;

  return (
    <Panel className={cn('flex flex-col', className)} aria-label="Organizational health">
      <PanelHeader title="Organizational health" description="Weighted across five factors" />
      <div className="flex items-end gap-5 px-4 pb-4">
        <div className="shrink-0">
          <p className="flex items-baseline gap-1">
            <span className="text-hero font-semibold tracking-[-0.03em] text-ink">{health.score}</span>
            <span className="text-ui text-ink-3">/ 100</span>
          </p>
          <p className="mt-1.5 flex items-center gap-1 text-meta text-ink-2">
            <DeltaIcon className={cn('size-3.5', health.delta < 0 ? 'text-critical' : 'text-good')} aria-hidden />
            {signed(health.delta)} in 4 weeks
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <Sparkline points={health.trend} label="Health score" height={72} />
        </div>
      </div>
      <ul className="px-4">
        {health.factors.map((factor) => (
          <FactorRow key={factor.id} factor={factor} />
        ))}
      </ul>
      <p className="mt-auto border-t border-line px-4 py-3 text-meta text-ink-2">
        <span className="font-medium text-ink">Lowest: {lowest.label}.</span> {lowest.explanation}
      </p>
    </Panel>
  );
}
