import type { AnswerBlock } from '@/api/types';
import { directory } from '../data';
import {
  blastRadiusAnswer,
  categoryAnswer,
  cyclesAnswer,
  decisionAnswer,
  departureAnswer,
  deployTimeAnswer,
  expertiseAnswer,
  findingAnswer,
  onboardingAnswer,
  ownershipAnswer,
  personBrief,
  projectAnswer,
  projectsAnswer,
  serviceBrief,
  serviceDecisionsAnswer,
  silosAnswer,
  topRisksAnswer,
  ungroundedAnswer,
  type Plan,
} from './answers';
import { findMentions, firstOfType, insightWithTitle, type Mention } from './lookup';

function hasContent(block: AnswerBlock): boolean {
  if (block.kind === 'table') return block.rows.length > 0;
  if (block.kind === 'findings' || block.kind === 'recommendations') return block.items.length > 0;
  return true;
}

/**
 * A small rule-based stand-in for the Reasoning Engine, used only in demo mode.
 *
 * It classifies the question with patterns and then computes the answer from the
 * sample directory, so results for arbitrary entities are real graph traversals over
 * sample data. It is not an LLM, and it says so in the UI. When it cannot ground an
 * answer it returns a refusal rather than inventing one.
 */
export function reason(question: string): Plan {
  const plan = route(question);
  // Answers are computed, so a heading can end up with nothing under it.
  return { ...plan, answer: { ...plan.answer, blocks: plan.answer.blocks.filter(hasContent) } };
}

function route(question: string): Plan {
  const q = question.toLowerCase();
  const mentions = findMentions(question);
  const service = firstOfType(mentions, 'service');
  const person = firstOfType(mentions, 'person');
  const team = firstOfType(mentions, 'team');
  const repository = firstOfType(mentions, 'repository');
  const decision = firstOfType(mentions, 'decision');
  const project = firstOfType(mentions, 'project');

  const matches = (...patterns: RegExp[]) => patterns.some((pattern) => pattern.test(q));

  if (matches(/\b(deploy\w*|pipelines?|ci)\b.*\b(time|slow\w*|long\w*|duration|increas\w*|longer)\b/, /\b(slow\w*|long\w*)\b.*\b(deploy\w*|pipelines?|ci)\b/)) {
    return deployTimeAnswer();
  }

  // Before any intent, so that the words in a finding's title cannot send it to the wrong answer.
  const finding = insightWithTitle(question);
  if (finding) return findingAnswer(finding);

  if (person && matches(/\b(leav\w*|depart\w*|quit\w*|resign\w*|bus factor|left|hit by|goes away|knowledge loss|retir\w*)\b/)) {
    return departureAnswer(person);
  }

  if (service && matches(/\b(blast radius|break\w*|down|outage|fail\w*|impact\w*|affect\w*|downstream|depends? on|dependents?)\b/) && !matches(/\bdecisions?\b/)) {
    return blastRadiusAnswer(service);
  }

  if (matches(/\b(onboard\w*|new (to|on|engineer|hire|joiner|starter)|getting started|get started|ramp\w* up|first week|start on)\b/) && team) {
    return onboardingAnswer(team);
  }

  if (matches(/\b(who|whom)\b.*\b(own\w*|maintain\w*|responsible|on[- ]?call|run\w*|talk|ask|contact|speak)\b/, /\bowner\b/, /\bon[- ]?call\b/) && (service || repository)) {
    return ownershipAnswer(service, repository?.id, matches(/\bon[- ]?call\b/) ? 'on_call' : 'owner');
  }

  if (service && !decision && matches(/\b(decisions?|adrs?)\b/)) return serviceDecisionsAnswer(service);

  // A named project beats any general pattern below, so "Is X on track?" answers about X.
  if (project && !decision) return projectAnswer(project);

  if (decision || matches(/\bwhy (did|do|was|were|are|is) (we|it|the)\b/, /\b(decision\w*|adr|rationale|chose|choose|decided)\b/)) {
    const plan = decisionAnswer(question, decision, service);
    if (plan) return plan;
  }

  if (matches(/\b(circular|cycles?|cyclic)\b/)) return cyclesAnswer();

  if (matches(/\b(silo\w*|bus factor|single point\w*|concentrat\w*)\b/)) return silosAnswer();
  if (matches(/\b(duplicat\w*|overlap\w*|same work|redundan\w*|reinvent\w*)\b/)) return categoryAnswer('duplicate_work');
  if (matches(/\b(outdated|stale|out of date)\b/, /\b(docs?|documentation|runbook\w*)\b/)) return categoryAnswer('outdated_docs');
  if (matches(/\b(tech\w* debt|debt|legacy)\b/)) return categoryAnswer('tech_debt');
  if (matches(/\b(vulnerab\w*|cve|dependency issues?|dependency risks?)\b/)) return categoryAnswer('dependency_issue');
  if (matches(/\b(deploy\w* risk\w*|release risk\w*|risky deploy\w*)\b/)) return categoryAnswer('deployment_risk');

  if (matches(/\bprojects?\b/, /\b(at risk|on track|blocked|behind schedule|late|delay\w*)\b/)) return projectsAnswer();
  if (matches(/\b(biggest|top|main|largest|greatest)\b.*\brisks?\b/, /\borganizational risk\b/, /\b(org|organization\w*) health\b/, /\bwhat should i worry\b/)) {
    return topRisksAnswer();
  }

  if (matches(/\b(who( else)? (knows|should|can)|expert\w*|talk to|ask about|understands?|experience (in|with))\b/)) {
    const plan = expertiseAnswer(question);
    if (plan) return plan;
  }

  return answerFromMentions(mentions, question);
}

/** No intent matched, but the question may still name something we know about. */
function answerFromMentions(mentions: Mention[], question: string): Plan {
  const [first] = mentions;
  if (!first) return ungroundedAnswer(question);

  switch (first.type) {
    case 'service':
      return serviceBrief(first.entity);
    case 'repository': {
      const linked = directory.services.find((s) => s.repositoryId === first.entity.id);
      return linked ? serviceBrief(linked) : ownershipAnswer(undefined, first.entity.id);
    }
    case 'person':
      return personBrief(first.entity);
    case 'team':
      return onboardingAnswer(first.entity);
    case 'project':
      return projectAnswer(first.entity);
    case 'decision':
      return decisionAnswer(question, first.entity) ?? ungroundedAnswer(question);
  }
}
