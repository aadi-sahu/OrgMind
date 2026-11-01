import type { EngineeringSignal, TrendPoint } from '@/api/types';
import { weekLabel } from './time';

const WEEKS = 26;

/** Small, repeatable variation so series look like measurements rather than formulas. */
const WOBBLE = [0.2, -0.3, 0.1, 0.4, -0.2, 0.3, -0.4, 0.1, 0.25, -0.15, 0.35, -0.25, 0.05];
const wobble = (i: number, scale = 1) => WOBBLE[i % WOBBLE.length] * scale;

const round1 = (value: number) => Math.round(value * 10) / 10;

export interface DeployStageWeek {
  week: string;
  build: number;
  unit: number;
  integration: number;
  rollout: number;
  total: number;
}

/**
 * Median deploy pipeline duration by stage, in minutes.
 * The steps line up with two decisions:
 * - ADR-024 (dropped per-repo build caches) rolled out 16 weeks ago: build jumps.
 * - ADR-035 (ephemeral per-PR environments) rolled out 10 weeks ago: integration jumps.
 * Unit tests grow slowly with repository size.
 */
export const deployStages: DeployStageWeek[] = Array.from({ length: WEEKS }, (_, i) => {
  const weeksBack = WEEKS - 1 - i;
  const build = weeksBack > 16 ? 3.4 + wobble(i, 0.15) : 6.3 + (16 - weeksBack) * 0.02 + wobble(i, 0.2);
  const unit = 2.6 + (i / (WEEKS - 1)) * 1.2 + wobble(i + 3, 0.1);
  const integration =
    weeksBack > 10 ? 3.2 + wobble(i + 5, 0.15) : 12.4 + (10 - weeksBack) * 0.15 + wobble(i + 5, 0.3);
  const rollout = 2.2 + (i / (WEEKS - 1)) * 0.3 + wobble(i + 7, 0.05);

  const stage = {
    week: weekLabel(weeksBack),
    build: round1(build),
    unit: round1(unit),
    integration: round1(integration),
    rollout: round1(rollout),
  };
  return { ...stage, total: round1(stage.build + stage.unit + stage.integration + stage.rollout) };
});

const series = (values: (i: number, weeksBack: number) => number): TrendPoint[] =>
  Array.from({ length: WEEKS }, (_, i) => ({
    label: weekLabel(WEEKS - 1 - i),
    value: values(i, WEEKS - 1 - i),
  }));

export const engineeringSignals: EngineeringSignal[] = [
  {
    id: 'deployDuration',
    label: 'Deploy time',
    unit: 'min',
    description: 'Median pipeline duration, from merge to production',
    lowerIsBetter: true,
    form: 'area',
    points: deployStages.map((week) => ({ label: week.week, value: week.total })),
  },
  {
    id: 'prCycleTime',
    label: 'PR cycle time',
    unit: 'h',
    description: 'Median time from pull request opened to merged',
    lowerIsBetter: true,
    form: 'area',
    points: series((i, back) => round1(31 - (back < 9 ? 7 + (9 - back) * 0.25 : i * 0.08) + wobble(i, 1.2))),
  },
  {
    id: 'deployFrequency',
    label: 'Deploy frequency',
    unit: 'per week',
    description: 'Production deploys across all services',
    lowerIsBetter: false,
    form: 'area',
    points: series((i, back) => Math.round((back > 10 ? 58 : 58 - (10 - back) * 1.7) + wobble(i, 4))),
  },
  {
    id: 'incidents',
    label: 'Incidents',
    unit: 'per week',
    description: 'Declared incidents of any severity',
    lowerIsBetter: true,
    form: 'bar',
    points: series((i) => [1, 2, 1, 0, 2, 1, 1, 3, 1, 2, 0, 2, 1, 2, 3, 1, 2, 2, 3, 2, 4, 2, 3, 3, 4, 3][i]),
  },
  {
    id: 'docsFreshness',
    label: 'Docs freshness',
    unit: '%',
    description: 'Documents updated within 90 days of the code they describe',
    lowerIsBetter: false,
    form: 'area',
    points: series((i) => Math.round(71 - (i / (WEEKS - 1)) * 13 + wobble(i, 1.5))),
  },
];

/** Knowledge graph size over the last 12 weeks, ending at the live count. */
export function graphGrowth(currentNodes: number, currentEdges: number) {
  const points = Array.from({ length: 12 }, (_, i) => {
    const back = 11 - i;
    return { back, label: weekLabel(back) };
  });
  return {
    nodes: points.map(({ back, label }) => ({ label, value: currentNodes - Math.round(back * 0.9) })),
    edges: points.map(({ back, label }) => ({ label, value: currentEdges - Math.round(back * 3.4) })),
  };
}
