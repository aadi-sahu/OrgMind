import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUp, FileSearch, GitBranch, History, Kanban, Network, Plus, Square, Users, type LucideIcon } from 'lucide-react';
import { api, isDemoMode, type SuggestionGroup, type SuggestionTopic } from '@/api';
import { Button, IconButton } from '@/components/ui/Button';
import { Menu } from '@/components/ui/Menu';
import { Drawer } from '@/components/ui/Overlay';
import { Skeleton } from '@/components/ui/States';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useResource } from '@/hooks/useResource';
import { conversationActions, useConversations } from './conversationStore';
import { EvidencePanel } from './EvidencePanel';
import { TurnView } from './TurnView';

const TOPIC_ICONS: Record<SuggestionTopic, LucideIcon> = {
  architecture: Network,
  dependencies: GitBranch,
  projects: Kanban,
  people: Users,
};

/** Used until, or instead of, the organization's own suggestions. Names nothing specific. */
const GENERIC_SUGGESTIONS: SuggestionGroup[] = [
  { topic: 'architecture', label: 'Architecture', questions: ['Why has deployment time increased?'] },
  { topic: 'dependencies', label: 'Dependencies', questions: ['Are there any circular dependencies?'] },
  { topic: 'projects', label: 'Projects', questions: ['Which projects are at risk?'] },
  { topic: 'people', label: 'People and knowledge', questions: ['Where are our biggest knowledge silos?'] },
];

function EmptyConversation({ onAsk }: { onAsk: (question: string) => void }) {
  const { data, loading } = useResource((signal) => api.listSuggestedQuestions(signal));
  const groups = data?.length ? data : GENERIC_SUGGESTIONS;

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col justify-center px-4 py-8">
      <h1 className="text-h1 font-semibold tracking-[-0.01em] text-ink">What do you want to understand?</h1>
      <p className="mt-1 text-body text-ink-2">
        Ask about architecture, dependencies, projects or expertise. Every answer shows its reasoning and its evidence.
      </p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {loading
          ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 rounded-md" />)
          : groups.map(({ topic, label, questions }) => {
              const Icon = TOPIC_ICONS[topic];
              return (
                <div key={topic}>
                  <h2 className="mb-1.5 flex items-center gap-1.5 text-meta font-medium text-ink-3">
                    <Icon className="size-3.5" aria-hidden />
                    {label}
                  </h2>
                  <ul className="space-y-1">
                    {questions.map((question) => (
                      <li key={question}>
                        <button
                          type="button"
                          onClick={() => onAsk(question)}
                          className="w-full rounded-md border border-line bg-surface px-3 py-2 text-left text-ui text-ink-2 transition-colors duration-100 hover:border-line-strong hover:bg-surface-2 hover:text-ink"
                        >
                          {question}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
      </div>
    </div>
  );
}

export default function AssistantPage() {
  const { conversations, activeId } = useConversations();
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState('');
  const [focusedTurnId, setFocusedTurnId] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const isWide = useMediaQuery('(min-width: 1180px)');

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const stickToBottom = useRef(true);
  const handledQuery = useRef<string | null>(null);

  const conversation = conversations.find((c) => c.id === activeId);
  const turns = useMemo(() => conversation?.turns ?? [], [conversation]);
  const last = turns[turns.length - 1];
  const isBusy = last?.status === 'thinking' || last?.status === 'streaming';

  const focusedTurn = turns.find((t) => t.id === focusedTurnId) ?? [...turns].reverse().find((t) => t.answer);

  // A link from elsewhere in the app starts its own conversation.
  const query = params.get('q');
  useEffect(() => {
    if (!query) {
      handledQuery.current = null;
      return;
    }
    if (handledQuery.current === query) return;
    handledQuery.current = query;
    setFocusedTurnId(null);
    setHighlight(null);
    stickToBottom.current = true;
    void conversationActions.ask(query, { newConversation: true });
    setParams({}, { replace: true });
  }, [query, setParams]);

  // Follow the answer as it arrives, unless the reader has scrolled up.
  const scrollKey = `${last?.id}:${last?.steps.length}:${last?.partialSummary.length}:${last?.status}`;
  useLayoutEffect(() => {
    const element = scrollRef.current;
    // The empty state has nothing to follow, and must start at the top on small screens.
    if (element && last && stickToBottom.current) element.scrollTop = element.scrollHeight;
  }, [scrollKey, last]);

  useLayoutEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
  }, [draft]);

  const ask = (question: string) => {
    const text = question.trim();
    if (!text || isBusy) return;
    setDraft('');
    setFocusedTurnId(null);
    setHighlight(null);
    stickToBottom.current = true;
    void conversationActions.ask(text);
  };

  const cite = (turnId: string, n: number) => {
    setFocusedTurnId(turnId);
    setHighlight(n);
    if (!isWide) setEvidenceOpen(true);
  };

  const showSources = (turnId: string) => {
    setFocusedTurnId(turnId);
    setHighlight(null);
    if (!isWide) setEvidenceOpen(true);
  };

  const sourceCount = focusedTurn?.answer?.sources.length ?? 0;

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-11 shrink-0 items-center gap-1.5 border-b border-line px-3 md:px-4">
          <p className="min-w-0 flex-1 truncate text-ui text-ink-2">{conversation?.title ?? 'New conversation'}</p>
          {conversations.length > 0 && (
            <Menu
              label="Conversation history"
              className="w-72"
              items={conversations.map((c) => ({
                id: c.id,
                label: c.title,
                checked: c.id === activeId,
                onSelect: () => {
                  setFocusedTurnId(null);
                  setHighlight(null);
                  conversationActions.select(c.id);
                },
              }))}
              trigger={(props) => (
                <Button variant="ghost" size="sm" icon={<History className="size-3.5" aria-hidden />} {...props}>
                  History
                </Button>
              )}
            />
          )}
          {!isWide && sourceCount > 0 && (
            <Button variant="ghost" size="sm" icon={<FileSearch className="size-3.5" aria-hidden />} onClick={() => setEvidenceOpen(true)}>
              Evidence
            </Button>
          )}
          <Button
            size="sm"
            icon={<Plus className="size-3.5" aria-hidden />}
            onClick={() => {
              conversationActions.newConversation();
              setFocusedTurnId(null);
              setHighlight(null);
              textareaRef.current?.focus();
            }}
          >
            New
          </Button>
        </div>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto"
          onScroll={(event) => {
            const el = event.currentTarget;
            stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          }}
        >
          {turns.length === 0 ? (
            <EmptyConversation onAsk={ask} />
          ) : (
            <div className="mx-auto max-w-3xl space-y-8 px-4 py-6">
              {/* Announce completion only. A live region around a streaming answer is unusable. */}
              <p className="sr-only" role="status">
                {last?.status === 'done' ? 'Answer ready' : ''}
              </p>
              {turns.map((turn) => (
                <TurnView
                  key={turn.id}
                  turn={turn}
                  conversationId={activeId as string}
                  isFocused={focusedTurn?.id === turn.id}
                  isBusy={isBusy}
                  onCite={(n) => cite(turn.id, n)}
                  onFocus={() => showSources(turn.id)}
                  onFollowUp={ask}
                />
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-line bg-bg px-3 pt-3 pb-2 md:px-4">
          <form
            className="mx-auto max-w-3xl"
            onSubmit={(event) => {
              event.preventDefault();
              ask(draft);
            }}
          >
            <div className="flex items-end gap-2 rounded-lg border border-line-strong bg-surface p-2 transition-colors duration-100 focus-within:border-ink-3">
              <textarea
                ref={textareaRef}
                rows={1}
                value={draft}
                aria-label="Ask a question about your organization"
                placeholder="Ask about architecture, dependencies, projects or people"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  // During IME composition, Enter confirms the text instead of sending it.
                  if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    ask(draft);
                  }
                }}
                className="max-h-40 min-h-6 flex-1 resize-none bg-transparent px-1 py-0.5 text-body text-ink outline-none placeholder:text-ink-3 focus-visible:outline-none"
              />
              {/* Distinct keys, or React reuses one element and a click on Stop finishes as a submit. */}
              {isBusy ? (
                <IconButton
                  key="stop"
                  label="Stop generating"
                  size="sm"
                  className="bg-surface-3 text-ink"
                  onClick={() => {
                    conversationActions.stop();
                    textareaRef.current?.focus();
                  }}
                >
                  <Square className="size-3 fill-current" aria-hidden />
                </IconButton>
              ) : (
                <IconButton
                  key="send"
                  label="Send question"
                  size="sm"
                  type="submit"
                  disabled={!draft.trim()}
                  className="bg-primary-bg text-primary-fg hover:bg-primary-bg-hover hover:text-primary-fg disabled:bg-surface-3 disabled:text-ink-3"
                >
                  <ArrowUp className="size-4" aria-hidden />
                </IconButton>
              )}
            </div>
            {isDemoMode && (
              <p className="mt-1.5 text-center text-micro text-ink-3">
                Demo mode: answers come from a local rule-based engine over sample data. No LLM or real system is queried.
              </p>
            )}
          </form>
        </div>
      </div>

      {isWide && (
        <aside className="flex w-[340px] shrink-0 flex-col border-l border-line bg-surface" aria-label="Evidence">
          <div className="flex h-11 shrink-0 items-center border-b border-line px-4">
            <h2 className="text-ui font-medium text-ink">Evidence</h2>
            {sourceCount > 0 && <span className="tabular ml-1.5 text-meta text-ink-3">{sourceCount}</span>}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <EvidencePanel answer={focusedTurn?.answer} highlight={highlight} />
          </div>
        </aside>
      )}

      {!isWide && evidenceOpen && (
        <Drawer title="Evidence" onClose={() => setEvidenceOpen(false)}>
          <EvidencePanel answer={focusedTurn?.answer} highlight={highlight} />
        </Drawer>
      )}
    </div>
  );
}
