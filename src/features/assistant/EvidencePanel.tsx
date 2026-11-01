import { useEffect, useRef } from 'react';
import { FileSearch } from 'lucide-react';
import { isDemoMode, type AssistantAnswer } from '@/api';
import { EmptyState } from '@/components/ui/States';
import { cn } from '@/lib/cn';
import { EvidenceCard } from '@/features/intelligence/EvidenceCard';

interface EvidencePanelProps {
  answer?: AssistantAnswer;
  highlight: number | null;
}

/** Sources behind one answer. Selecting a citation in the answer highlights its source here. */
export function EvidencePanel({ answer, highlight }: EvidencePanelProps) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (highlight === null) return;
    listRef.current
      ?.querySelector(`[data-source="${highlight}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [highlight]);

  if (!answer || answer.sources.length === 0) {
    return (
      <EmptyState
        className="h-full"
        icon={<FileSearch className="size-4" aria-hidden />}
        title="No evidence to show yet"
        description="The sources behind each answer appear here."
      />
    );
  }

  return (
    <>
      {isDemoMode && <p className="mb-2 text-meta text-ink-3">These are sample sources with no links to real systems.</p>}
      <ul ref={listRef} className="space-y-2">
        {answer.sources.map((source) => (
          <li
            key={source.n}
            data-source={source.n}
            className={cn('rounded-md transition-shadow duration-150', highlight === source.n && 'shadow-[0_0_0_1.5px_var(--accent)]')}
          >
            <EvidenceCard
              item={source}
              marker={
                <span className="tabular flex size-4 shrink-0 items-center justify-center rounded border border-line-strong text-[10px] font-medium text-ink-2">
                  {source.n}
                </span>
              }
            />
          </li>
        ))}
      </ul>
    </>
  );
}
