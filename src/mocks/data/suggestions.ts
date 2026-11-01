import type { SuggestionGroup } from '@/api/types';

/** Starter questions that name things in the sample organization. */
export const suggestedQuestions: SuggestionGroup[] = [
  {
    topic: 'architecture',
    label: 'Architecture',
    questions: ['Why has deployment time increased?', 'Why did we move from RabbitMQ to Kafka?'],
  },
  {
    topic: 'dependencies',
    label: 'Dependencies',
    questions: ['What breaks if route-engine goes down?', 'Are there any circular dependencies?'],
  },
  {
    topic: 'projects',
    label: 'Projects',
    questions: ['Which projects are at risk?', 'What duplicate work is happening across teams?'],
  },
  {
    topic: 'people',
    label: 'People and knowledge',
    questions: ['What happens when Henrik Lindqvist leaves?', 'Who knows Kafka?'],
  },
];
