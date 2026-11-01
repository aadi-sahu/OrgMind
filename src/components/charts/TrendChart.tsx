import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TrendPoint } from '@/api';
import { AXIS_LINE, AXIS_TICK, ChartTooltipBox, GRID_STROKE } from './ChartParts';

interface TrendChartProps {
  points: TrendPoint[];
  label: string;
  unit: string;
  form?: 'area' | 'bar';
  height?: number;
  /** Tight y-axis instead of starting from zero. Area form only. */
  zeroBased?: boolean;
}

const SERIES_COLOR = 'var(--accent)';

/** Single-series trend. There is one colour, so the panel title does the legend's job. */
export function TrendChart({ points, label, unit, form = 'area', height = 220, zeroBased = true }: TrendChartProps) {
  const tooltip = (
    <Tooltip
      cursor={form === 'area' ? { stroke: 'var(--line-strong)' } : { fill: 'var(--surface-2)' }}
      isAnimationActive={false}
      content={({ active, payload, label: x }) =>
        active && payload?.length ? (
          <ChartTooltipBox
            title={String(x)}
            rows={[{ key: 'v', label, value: `${payload[0].value}${unit ? ` ${unit}` : ''}`, color: SERIES_COLOR }]}
          />
        ) : null
      }
    />
  );

  const axes = (
    <>
      <CartesianGrid vertical={false} stroke={GRID_STROKE} />
      <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={AXIS_LINE} minTickGap={36} interval="preserveStartEnd" />
      <YAxis
        tick={AXIS_TICK}
        tickLine={false}
        axisLine={false}
        width={32}
        allowDecimals={false}
        domain={zeroBased ? [0, 'auto'] : ['auto', 'auto']}
      />
      {tooltip}
    </>
  );

  return (
    <div style={{ height }} role="img" aria-label={`${label} over time`}>
      <ResponsiveContainer width="100%" height="100%">
        {form === 'area' ? (
          <AreaChart data={points} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
            {axes}
            <Area
              type="monotone"
              dataKey="value"
              stroke={SERIES_COLOR}
              strokeWidth={2}
              fill={SERIES_COLOR}
              fillOpacity={0.1}
              activeDot={{ r: 4, fill: SERIES_COLOR, stroke: 'var(--surface)', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        ) : (
          <BarChart data={points} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
            {axes}
            <Bar dataKey="value" fill={SERIES_COLOR} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

/** Minimal area for stat tiles. Hover reveals the value; no axes. */
export function Sparkline({ points, label, unit = '', height = 48 }: { points: TrendPoint[]; label: string; unit?: string; height?: number }) {
  return (
    <div style={{ height }} role="img" aria-label={`${label}, ${points.length} points, latest ${points[points.length - 1]?.value}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
          <XAxis dataKey="label" hide />
          <Tooltip
            cursor={{ stroke: 'var(--line-strong)' }}
            isAnimationActive={false}
            content={({ active, payload, label: x }) =>
              active && payload?.length ? (
                <ChartTooltipBox title={String(x)} rows={[{ key: 'v', label, value: `${payload[0].value}${unit}`, color: SERIES_COLOR }]} />
              ) : null
            }
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={SERIES_COLOR}
            strokeWidth={2}
            fill={SERIES_COLOR}
            fillOpacity={0.1}
            activeDot={{ r: 4, fill: SERIES_COLOR, stroke: 'var(--surface)', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
