import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AXIS_LINE, AXIS_TICK, ChartFrame, ChartTooltipBox, GRID_STROKE, LegendRow } from './ChartParts';

/** Categorical slots, in the validated order. Colour follows the series, not its rank. */
const SERIES_COLORS = ['var(--e-person)', 'var(--e-team)', 'var(--e-project)', 'var(--e-service)', 'var(--e-repository)', 'var(--e-decision)'];
/** The number of series comes from the backend, and every one of them needs a colour. */
const seriesColor = (index: number) => SERIES_COLORS[index % SERIES_COLORS.length];

interface StackedBarChartProps {
  title: string;
  unit: string;
  xKey: string;
  series: { key: string; label: string }[];
  data: Record<string, string | number>[];
  height?: number;
}

export function StackedBarChart({ title, unit, xKey, series, data, height = 220 }: StackedBarChartProps) {
  const legend = series.map((s, i) => ({ key: s.key, label: s.label, color: seriesColor(i) }));

  const total = (row: Record<string, string | number>) =>
    series.reduce((sum, s) => sum + Number(row[s.key] ?? 0), 0);

  return (
    <ChartFrame
      caption={title}
      toolbar={<LegendRow items={legend} />}
      columns={['Week', ...series.map((s) => s.label), 'Total']}
      rows={data.map((row) => [String(row[xKey]), ...series.map((s) => Number(row[s.key]).toFixed(1)), total(row).toFixed(1)])}
      chart={
        <div style={{ height }} role="img" aria-label={`${title}, stacked by ${series.map((s) => s.label).join(', ')}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID_STROKE} />
              <XAxis dataKey={xKey} tick={AXIS_TICK} tickLine={false} axisLine={AXIS_LINE} minTickGap={28} interval="preserveStartEnd" />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: 'var(--surface-3)', fillOpacity: 0.5 }}
                isAnimationActive={false}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <ChartTooltipBox
                      title={String(label)}
                      rows={[...legend].reverse().map((item) => ({
                        key: item.key,
                        label: item.label,
                        color: item.color,
                        value: `${Number(payload.find((p) => p.dataKey === item.key)?.value ?? 0).toFixed(1)} ${unit}`,
                      }))}
                      footer={`${total(payload[0].payload as Record<string, number>).toFixed(1)} ${unit} total`}
                    />
                  ) : null
                }
              />
              {series.map((s, i) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  stackId="stack"
                  fill={seriesColor(i)}
                  stroke="var(--surface)"
                  strokeWidth={1}
                  radius={i === series.length - 1 ? [4, 4, 0, 0] : 0}
                  maxBarSize={24}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      }
    />
  );
}
