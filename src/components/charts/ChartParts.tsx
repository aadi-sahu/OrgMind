import { useState, type ReactNode } from 'react';
import { BarChart3, Table2 } from 'lucide-react';
import { SegmentedControl } from '@/components/ui/Tabs';

/** Recessive axis styling shared by every chart. */
export const AXIS_TICK = { fill: 'var(--ink-3)', fontSize: 11 };
export const AXIS_LINE = { stroke: 'var(--axis)' };
export const GRID_STROKE = 'var(--grid)';

export interface TooltipRow {
  key: string;
  label: string;
  value: string;
  color: string;
}

/** Values lead and labels follow, because here the reader wants the number. */
export function ChartTooltipBox({ title, rows, footer }: { title: string; rows: TooltipRow[]; footer?: string }) {
  return (
    <div className="min-w-32 rounded-md bg-surface-2 px-2.5 py-2 text-meta shadow-pop">
      <p className="mb-1 text-ink-3">{title}</p>
      <ul className="space-y-0.5">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center gap-2">
            <span className="h-0.5 w-2.5 rounded-full" style={{ background: row.color }} aria-hidden />
            <span className="tabular font-medium text-ink">{row.value}</span>
            <span className="text-ink-3">{row.label}</span>
          </li>
        ))}
      </ul>
      {footer && <p className="tabular mt-1 border-t border-line-strong pt-1 font-medium text-ink">{footer}</p>}
    </div>
  );
}

/** Legend entry: a colour swatch beside text that stays in ink tokens. */
export function LegendRow({ items }: { items: { key: string; label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5 text-meta text-ink-2">
          <span className="size-2 rounded-[2px]" style={{ background: item.color }} aria-hidden />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

type ViewMode = 'chart' | 'table';

interface ChartFrameProps {
  /** Rendered in chart view. */
  chart: ReactNode;
  caption: string;
  columns: string[];
  rows: (string | number)[][];
  /** Content on the left side of the row holding the view toggle. */
  toolbar?: ReactNode;
}

/** Every chart has a table twin, so no value is reachable only by hovering. */
export function ChartFrame({ chart, caption, columns, rows, toolbar }: ChartFrameProps) {
  const [mode, setMode] = useState<ViewMode>('chart');

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">{toolbar}</div>
        <SegmentedControl
          label={`${caption}: view`}
          value={mode}
          onChange={setMode}
          items={[
            { value: 'chart', label: 'Chart', icon: <BarChart3 className="size-3" aria-hidden /> },
            { value: 'table', label: 'Table', icon: <Table2 className="size-3" aria-hidden /> },
          ]}
        />
      </div>
      {mode === 'chart' ? (
        chart
      ) : (
        <div className="max-h-56 overflow-auto rounded border border-line">
          <table className="w-full text-left text-meta">
            <caption className="sr-only">{caption}</caption>
            <thead className="sticky top-0 bg-surface-2">
              <tr>
                {columns.map((column, i) => (
                  <th key={column} scope="col" className={`h-7 px-2.5 font-normal whitespace-nowrap text-ink-3 ${i > 0 ? 'text-right' : ''}`}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <tr key={r} className="border-t border-line">
                  {row.map((cell, c) => (
                    <td key={c} className={`h-7 px-2.5 whitespace-nowrap ${c > 0 ? 'tabular text-right text-ink' : 'text-ink-2'}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
