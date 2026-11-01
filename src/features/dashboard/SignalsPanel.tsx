import { useMemo, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { api, type SignalId } from '@/api';
import { ChartFrame } from '@/components/charts/ChartParts';
import { TrendChart } from '@/components/charts/TrendChart';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { SegmentedControl, Tabs } from '@/components/ui/Tabs';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useResource } from '@/hooks/useResource';
import { cn } from '@/lib/cn';

type Range = '4' | '12' | '26';

const RANGES: { value: Range; label: string }[] = [
  { value: '4', label: '4w' },
  { value: '12', label: '12w' },
  { value: '26', label: '26w' },
];

export function SignalsPanel({ className }: { className?: string }) {
  const { data, error, loading, refetch } = useResource((signal) => api.getSignals(signal));
  const [signalId, setSignalId] = useState<SignalId>('deployDuration');
  const [range, setRange] = useState<Range>('26');

  const signal = data?.find((s) => s.id === signalId) ?? data?.[0];
  const points = useMemo(() => signal?.points.slice(-Number(range)) ?? [], [signal, range]);

  const first = points[0]?.value ?? 0;
  const last = points[points.length - 1]?.value ?? 0;
  const change = first === 0 ? 0 : Math.round(((last - first) / first) * 100);
  const improved = signal ? (signal.lowerIsBetter ? change < 0 : change > 0) : false;

  return (
    <Panel className={className} aria-label="Engineering signals">
      <PanelHeader
        title="Engineering signals"
        description={signal?.description ?? 'Delivery and quality trends'}
        actions={<SegmentedControl label="Time range" value={range} onChange={setRange} items={RANGES} />}
      />
      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : loading ? (
        <div className="px-4 pb-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="mt-4 h-[248px] w-full" />
        </div>
      ) : !data || !signal ? (
        <EmptyState
          icon={<Activity className="size-4" aria-hidden />}
          title="No signals yet"
          description="Delivery and quality trends appear here once a connected data source has synced."
        />
      ) : (
        <>
          <Tabs
            label="Signal"
            value={signal.id}
            onChange={setSignalId}
            items={data.map((s) => ({ value: s.id, label: s.label }))}
            className="px-4"
          />
          <div className="p-4">
            <ChartFrame
              caption={`${signal.label}, weekly`}
              columns={['Week', `${signal.label} (${signal.unit})`]}
              rows={points.map((p) => [p.label, p.value])}
              toolbar={
                <p className="flex items-center gap-2 text-ui text-ink-2">
                  <span className="text-title font-semibold text-ink">
                    {last} {signal.unit}
                  </span>
                  {change !== 0 && (
                    <span className="flex items-center gap-0.5 text-meta">
                      {change > 0 ? (
                        <ArrowUpRight className={cn('size-3.5', improved ? 'text-good' : 'text-critical')} aria-hidden />
                      ) : (
                        <ArrowDownRight className={cn('size-3.5', improved ? 'text-good' : 'text-critical')} aria-hidden />
                      )}
                      {Math.abs(change)}% in {range} weeks
                    </span>
                  )}
                </p>
              }
              chart={<TrendChart points={points} label={signal.label} unit={signal.unit} form={signal.form} />}
            />
          </div>
        </>
      )}
    </Panel>
  );
}
