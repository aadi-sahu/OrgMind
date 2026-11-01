import { ExternalLink } from 'lucide-react';
import type { EvidenceItem } from '@/api';
import { timeAgo } from '@/lib/format';
import { EVIDENCE_META } from './meta';

/** One piece of supporting evidence. Links out only when a real source URL exists. */
export function EvidenceCard({ item, marker }: { item: EvidenceItem; marker?: React.ReactNode }) {
  const meta = EVIDENCE_META[item.kind];
  const Icon = meta.icon;

  return (
    <div className="rounded-md border border-line bg-surface-2 p-2.5">
      <p className="flex items-center gap-1.5 text-micro text-ink-3">
        {marker}
        <Icon className="size-3 shrink-0" aria-hidden />
        <span className="truncate">
          {meta.label === item.system ? meta.label : `${meta.label} · ${item.system}`}
        </span>
        {item.occurredAt && <span className="tabular ml-auto shrink-0">{timeAgo(item.occurredAt)}</span>}
      </p>
      <p className="mt-1 text-ui font-medium text-ink">
        {item.href ? (
          <a href={item.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
            {item.title}
            <ExternalLink className="size-3" aria-hidden />
          </a>
        ) : (
          item.title
        )}
      </p>
      <p className="mt-0.5 text-ui text-ink-2">{item.excerpt}</p>
    </div>
  );
}
