import { Fragment } from 'react';
import type { AnswerBlock } from '@/api';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { EntityLink } from '@/components/domain/entity';

/** Renders text with [n] citations as buttons that open the matching source. */
export function CitedText({ text, onCite }: { text: string; onCite: (n: number) => void }) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <>
      {parts.map((part, index) => {
        const match = /^\[(\d+)\]$/.exec(part);
        if (!match) return <Fragment key={index}>{part}</Fragment>;
        const n = Number(match[1]);
        return (
          <button
            key={index}
            type="button"
            onClick={() => onCite(n)}
            aria-label={`Show source ${n}`}
            className="tabular mx-px inline-flex h-4 min-w-4 -translate-y-px items-center justify-center rounded border border-line-strong bg-surface-2 px-0.5 align-middle text-[10px] font-medium text-ink-2 transition-colors duration-100 hover:border-accent hover:text-ink"
          >
            {n}
          </button>
        );
      })}
    </>
  );
}

function BlockTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="mb-2 text-ui font-medium text-ink">{children}</h4>;
}

export function AnswerBlockView({ block, onCite }: { block: AnswerBlock; onCite: (n: number) => void }) {
  switch (block.kind) {
    case 'paragraph':
      return (
        <p className="text-body text-ink-2">
          <CitedText text={block.text} onCite={onCite} />
        </p>
      );

    case 'findings':
      return (
        <div>
          <BlockTitle>{block.title}</BlockTitle>
          <ul className="divide-y divide-line rounded-md border border-line">
            {block.items.map((item) => (
              <li key={item.title} className="px-3 py-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="text-ui font-medium text-ink">{item.title}</p>
                  {item.metric && <p className="tabular text-meta text-ink-3 first-letter:uppercase">{item.metric}</p>}
                </div>
                <p className="mt-0.5 text-ui text-ink-2">
                  <CitedText text={item.detail} onCite={onCite} />
                </p>
              </li>
            ))}
          </ul>
        </div>
      );

    case 'recommendations':
      return (
        <div>
          <BlockTitle>{block.title}</BlockTitle>
          <ol className="space-y-2">
            {block.items.map((item, index) => (
              <li key={item.title} className="flex gap-2.5">
                <span className="tabular mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full border border-line-strong text-micro text-ink-3">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-ui text-ink">{item.title}</p>
                  {(item.detail || item.ownerId) && (
                    <p className="text-ui text-ink-2">
                      {item.detail && <CitedText text={item.detail} onCite={onCite} />}
                      {item.ownerId && (
                        <span className="ml-1 inline-flex items-center gap-1 align-baseline text-meta text-ink-3">
                          Suggested owner: <EntityLink id={item.ownerId} glyph={false} className="text-ink-2" />
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      );

    case 'table':
      return (
        <div>
          <BlockTitle>{block.title}</BlockTitle>
          <div className="overflow-x-auto rounded-md border border-line">
            <table className="w-full text-left text-ui">
              <caption className="sr-only">{block.title}</caption>
              <thead>
                <tr className="border-b border-line bg-surface-2">
                  {block.columns.map((column) => (
                    <th key={column} scope="col" className="h-8 px-3 text-meta font-normal whitespace-nowrap text-ink-3">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r} className="border-b border-line last:border-b-0">
                    {row.map((cell, c) => (
                      <td key={c} className="px-3 py-2 align-top text-ink-2">
                        {typeof cell === 'string' ? cell : <EntityLink id={cell.entityId} />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case 'stacked-chart':
      return (
        <div className="rounded-md border border-line p-3">
          <h4 className="text-ui font-medium text-ink">{block.title}</h4>
          <p className="mb-2 text-meta text-ink-3">{block.subtitle}</p>
          <StackedBarChart title={block.title} unit={block.unit} xKey={block.xKey} series={block.series} data={block.data} />
        </div>
      );
  }
}
