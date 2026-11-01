import { useState } from 'react';
import { AlertCircle, Check, ChevronRight, CircleSlash, Copy, Loader2, ThumbsDown, ThumbsUp } from 'lucide-react';
import { EntityChip } from '@/components/domain/entity';
import { IconButton } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { AnswerBlockView, CitedText } from './AnswerBlocks';
import { conversationActions, type Turn } from './conversationStore';

const CONFIDENCE_LABEL = { high: 'High confidence', medium: 'Medium confidence', low: 'Low confidence' } as const;

function ReasoningTrace({ turn }: { turn: Turn }) {
  const running = turn.status === 'thinking';
  const [expanded, setExpanded] = useState(false);
  const show = running || expanded;

  if (turn.steps.length === 0) {
    return running ? (
      <p className="flex items-center gap-2 text-ui text-ink-3" role="status">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        Starting investigation
      </p>
    ) : null;
  }

  return (
    <div>
      {running ? (
        <p className="mb-1.5 text-ui text-ink-3" role="status">
          Investigating
        </p>
      ) : (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 rounded text-meta text-ink-3 transition-colors duration-100 hover:text-ink"
        >
          <ChevronRight className={cn('size-3.5 transition-transform duration-100', expanded && 'rotate-90')} aria-hidden />
          Reasoned through {turn.steps.length} {turn.steps.length === 1 ? 'step' : 'steps'}
        </button>
      )}
      {show && (
        <ol className={cn('space-y-1', !running && 'mt-1.5 ml-1 border-l border-line pl-3')}>
          {turn.steps.map((step, index) => {
            const active = running && index === turn.steps.length - 1;
            return (
              <li key={step.id} className="flex animate-rise items-start gap-2 text-ui">
                {active ? (
                  <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin text-ink-3" aria-hidden />
                ) : (
                  <Check className="mt-0.5 size-3.5 shrink-0 text-ink-3" aria-hidden />
                )}
                <span className="min-w-0">
                  <span className={active ? 'text-ink' : 'text-ink-2'}>{step.label}</span>
                  {step.detail && <span className="text-ink-3"> · {step.detail}</span>}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

interface TurnViewProps {
  turn: Turn;
  conversationId: string;
  isFocused: boolean;
  onCite: (n: number) => void;
  onFocus: () => void;
  onFollowUp: (question: string) => void;
  isBusy: boolean;
}

export function TurnView({ turn, conversationId, isFocused, onCite, onFocus, onFollowUp, isBusy }: TurnViewProps) {
  const toast = useToast();
  const { answer } = turn;

  const copy = async () => {
    const text = (answer?.summary ?? turn.partialSummary).replace(/\s*\[\d+\]/g, '');
    try {
      await navigator.clipboard.writeText(text);
      toast('Answer copied');
    } catch {
      toast('Could not access the clipboard', 'error');
    }
  };

  return (
    <article className="animate-rise">
      <div className="mb-4 flex justify-end">
        <p className="max-w-[85%] rounded-lg bg-surface-3 px-3 py-2 text-body whitespace-pre-wrap text-ink">{turn.question}</p>
      </div>

      <div className="space-y-4">
        <ReasoningTrace turn={turn} />

        {turn.status === 'error' && (
          <p role="alert" className="flex items-start gap-2 rounded-md border border-line-strong bg-surface p-3 text-ui text-ink">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-critical" aria-hidden />
            {turn.error}
          </p>
        )}

        {(turn.partialSummary || answer) && (
          <p className="text-body text-ink">
            <CitedText text={answer?.summary ?? turn.partialSummary} onCite={onCite} />
            {turn.status === 'streaming' && (
              <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse-soft bg-ink align-middle" aria-hidden />
            )}
          </p>
        )}

        {turn.status === 'stopped' && (
          <p className="flex items-center gap-1.5 text-meta text-ink-3">
            <CircleSlash className="size-3.5" aria-hidden />
            You stopped this answer before it finished.
          </p>
        )}

        {answer && (
          <>
            {answer.blocks.map((block, index) => (
              <div key={index} className="animate-rise">
                <AnswerBlockView block={block} onCite={onCite} />
              </div>
            ))}

            {answer.entityIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {answer.entityIds.map((id) => (
                  <EntityChip key={id} id={id} />
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-2">
              <p className="text-meta text-ink-3">
                <span className="text-ink-2">{CONFIDENCE_LABEL[answer.confidence]}.</span> {answer.confidenceReason}
              </p>
              <div className="ml-auto flex items-center gap-0.5">
                {answer.sources.length > 0 && (
                  <button
                    type="button"
                    onClick={onFocus}
                    className={cn(
                      'mr-1 h-7 rounded-md px-2 text-meta transition-colors duration-100 hover:bg-surface-2',
                      isFocused ? 'text-ink' : 'text-ink-2',
                    )}
                  >
                    {answer.sources.length} {answer.sources.length === 1 ? 'source' : 'sources'}
                  </button>
                )}
                <IconButton label="Copy answer" size="sm" onClick={copy}>
                  <Copy className="size-3.5" aria-hidden />
                </IconButton>
                <IconButton
                  label="Good answer"
                  size="sm"
                  aria-pressed={turn.feedback === 'up'}
                  className={turn.feedback === 'up' ? 'text-ink' : undefined}
                  onClick={() => conversationActions.setFeedback(conversationId, turn.id, 'up')}
                >
                  <ThumbsUp className={cn('size-3.5', turn.feedback === 'up' && 'fill-current')} aria-hidden />
                </IconButton>
                <IconButton
                  label="Bad answer"
                  size="sm"
                  aria-pressed={turn.feedback === 'down'}
                  className={turn.feedback === 'down' ? 'text-ink' : undefined}
                  onClick={() => conversationActions.setFeedback(conversationId, turn.id, 'down')}
                >
                  <ThumbsDown className={cn('size-3.5', turn.feedback === 'down' && 'fill-current')} aria-hidden />
                </IconButton>
              </div>
            </div>

            {answer.followUps.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {answer.followUps.map((question) => (
                  <button
                    key={question}
                    type="button"
                    disabled={isBusy}
                    onClick={() => onFollowUp(question)}
                    className="rounded-md border border-line-strong bg-surface px-2.5 py-1 text-left text-meta text-ink-2 transition-colors duration-100 hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </article>
  );
}
