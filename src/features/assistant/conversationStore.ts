import { useSyncExternalStore } from 'react';
import { api, type AssistantAnswer, type ReasoningStep } from '@/api';

export type TurnStatus = 'thinking' | 'streaming' | 'done' | 'stopped' | 'error';

export interface Turn {
  id: string;
  question: string;
  status: TurnStatus;
  steps: ReasoningStep[];
  partialSummary: string;
  answer?: AssistantAnswer;
  error?: string;
  feedback?: 'up' | 'down';
}

export interface Conversation {
  id: string;
  title: string;
  turns: Turn[];
}

interface State {
  conversations: Conversation[];
  activeId: string | null;
}

/**
 * Conversations live outside React, so that an answer keeps streaming while you look at
 * another page and is still there when you come back. Held in memory only; the backend
 * should own history once it exists.
 */
let state: State = { conversations: [], activeId: null };
let controller: AbortController | null = null;
const listeners = new Set<() => void>();

const uid = () => crypto.randomUUID();

function setState(next: State) {
  state = next;
  listeners.forEach((listener) => listener());
}

function updateTurn(conversationId: string, turnId: string, update: (turn: Turn) => Turn) {
  setState({
    ...state,
    conversations: state.conversations.map((conversation) =>
      conversation.id === conversationId
        ? { ...conversation, turns: conversation.turns.map((turn) => (turn.id === turnId ? update(turn) : turn)) }
        : conversation,
    ),
  });
}

export const conversationActions = {
  async ask(question: string, options: { newConversation?: boolean } = {}) {
    const text = question.trim();
    if (!text) return;

    controller?.abort();
    const abort = new AbortController();
    controller = abort;

    const turn: Turn = { id: uid(), question: text, status: 'thinking', steps: [], partialSummary: '' };
    const existing = !options.newConversation && state.conversations.find((c) => c.id === state.activeId);
    const conversationId = existing ? existing.id : uid();

    setState({
      activeId: conversationId,
      conversations: existing
        ? state.conversations.map((c) => (c.id === conversationId ? { ...c, turns: [...c.turns, turn] } : c))
        : [{ id: conversationId, title: text, turns: [turn] }, ...state.conversations],
    });

    try {
      await api.askAssistant({ question: text, conversationId }, (event) => {
        if (event.type === 'step') {
          updateTurn(conversationId, turn.id, (t) => ({ ...t, steps: [...t.steps, event.step] }));
        } else if (event.type === 'summary_delta') {
          updateTurn(conversationId, turn.id, (t) => ({
            ...t,
            status: 'streaming',
            partialSummary: t.partialSummary + event.text,
          }));
        } else {
          updateTurn(conversationId, turn.id, (t) => ({ ...t, status: 'done', answer: event.answer }));
        }
      }, abort.signal);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        updateTurn(conversationId, turn.id, (t) => (t.status === 'done' ? t : { ...t, status: 'stopped' }));
      } else {
        updateTurn(conversationId, turn.id, (t) => ({
          ...t,
          status: 'error',
          error: error instanceof Error ? error.message : 'The assistant could not answer.',
        }));
      }
    } finally {
      if (controller === abort) controller = null;
    }
  },

  stop() {
    controller?.abort();
  },

  newConversation() {
    controller?.abort();
    setState({ ...state, activeId: null });
  },

  select(id: string) {
    controller?.abort();
    setState({ ...state, activeId: id });
  },

  setFeedback(conversationId: string, turnId: string, feedback: 'up' | 'down') {
    updateTurn(conversationId, turnId, (t) => ({ ...t, feedback: t.feedback === feedback ? undefined : feedback }));
  },
};

export function useConversations() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );
}
