import type {
  AssistantAnswer,
  Decision,
  Insight,
  InsightCategory,
  Person,
  Project,
  ReasoningStep,
  Service,
  Team,
} from '@/api/types';
import { deployStages, directory } from '../data';
import { daysAgo, minutesAgo } from '../data/time';
import { currentInsights } from '../demoState';
import {
  bySeverity,
  Citations,
  decisionById,
  dependentsOf,
  GRAPH_SYSTEM,
  insightsByCategory,
  insightsFor,
  personById,
  personName,
  repoById,
  serviceById,
  serviceName,
  teamById,
  teamName,
} from './lookup';

export interface Plan {
  steps: ReasoningStep[];
  answer: AssistantAnswer;
}

const step = (id: string, label: string, detail: string): ReasoningStep => ({ id, label, detail });
const daysUntil = (iso: string) => Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
const unique = (ids: string[]) => [...new Set(ids)];
const listOf = (items: string[]) =>
  items.length <= 1
    ? items.join('')
    : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

function citeEvidence(insight: Insight, citations: Citations): string {
  return insight.evidence.map((item) => citations.add(item)).join('');
}

/* ------------------------------------------------------------- Deploy duration */

export function deployTimeAnswer(): Plan {
  const first = deployStages[0];
  const last = deployStages[deployStages.length - 1];
  const totalDelta = last.total - first.total;
  const pct = (a: number, b: number) => Math.round(((b - a) / totalDelta) * 100);
  const integrationShare = pct(first.integration, last.integration);
  const buildShare = pct(first.build, last.build);
  const unitShare = pct(first.unit, last.unit);

  const c = new Citations();
  const metric = c.add({
    kind: 'metric', system: 'CI/CD', title: 'Pipeline duration by stage, 26 weeks',
    excerpt: `Median total went from ${first.total} to ${last.total} minutes. Integration tests went from ${first.integration} to ${last.integration} minutes.`,
  });
  const adr35 = c.add({
    kind: 'adr', system: 'GitLab', title: 'ADR-035: Ephemeral per-PR environments',
    excerpt: 'Each pull request gets an isolated Kubernetes namespace with its own dependencies.',
    occurredAt: daysAgo(77),
  });
  const adr24 = c.add({
    kind: 'adr', system: 'GitLab', title: 'ADR-024: Shared CI templates and a central runner pool',
    excerpt: 'All repositories inherit shared CI templates. Per-repository build caches were dropped.',
    occurredAt: daysAgo(118),
  });
  const pr = c.add({
    kind: 'pull_request', system: 'GitLab', title: 'kestrel/ci-templates !388',
    excerpt: 'Raises the integration test stage to 8 GB per job, after runner out-of-memory failures.',
    occurredAt: daysAgo(1),
  });
  const growth = c.add({
    kind: 'metric', system: 'GitHub', title: 'Repository growth, 26 weeks',
    excerpt: 'driver-app and billing-service grew by 18% and 11% in lines of code. Unit test count grew 22%.',
  });
  const noise = c.add({
    kind: 'metric', system: 'CI/CD', title: 'Pipeline runs by change type',
    excerpt: '23% of full pipeline runs in the last 30 days only changed documentation or comments.',
  });
  const incident = c.add({
    kind: 'incident', system: 'Slack', title: '#inc-2291',
    excerpt: 'A rollback during the Sev-2 took 24 minutes because it went through the full pipeline.',
    occurredAt: minutesAgo(26),
  });
  const kickoff = c.add({
    kind: 'document', system: 'Google Drive', title: 'CI Modernization kickoff notes',
    excerpt: 'Test sharding pilot chosen. Build cache restoration is the second workstream.',
    occurredAt: daysAgo(5),
  });

  return {
    steps: [
      step('history', 'Reviewing deployment history', '1,240 production deploys across 16 services'),
      step('cicd', 'Analyzing CI/CD metrics', 'Pipeline duration by stage over 26 weeks'),
      step('prs', 'Checking pull requests', '38 merged changes to kestrel/ci-templates'),
      step('infra', 'Correlating infrastructure changes', 'Matched two step changes to ADR-024 and ADR-035'),
      step('growth', 'Measuring repository growth', 'Lines of code and test counts for 19 repositories'),
      step('tests', 'Examining testing trends', 'Stage timing, flakiness and retry rate'),
      step('incidents', 'Linking related incidents', 'Rollback duration in 6 incidents'),
    ],
    answer: {
      summary: `Median deploy time rose from ${first.total} to ${last.total} minutes over 26 weeks ${metric}. Two platform decisions explain most of it: ephemeral integration environments account for about ${integrationShare}% of the increase ${adr35}, and removing per-repository build caches accounts for about ${buildShare}% ${adr24}.`,
      blocks: [
        {
          kind: 'stacked-chart',
          title: 'Median pipeline duration by stage',
          subtitle: 'Minutes per deploy, weekly',
          unit: 'min',
          xKey: 'week',
          series: [
            { key: 'build', label: 'Build' },
            { key: 'unit', label: 'Unit tests' },
            { key: 'integration', label: 'Integration tests' },
            { key: 'rollout', label: 'Rollout' },
          ],
          data: deployStages.filter((_, i) => i % 2 === 1).map(({ week, build, unit, integration, rollout }) => ({ week, build, unit, integration, rollout })),
        },
        {
          kind: 'findings',
          title: 'What changed',
          items: [
            {
              title: 'Integration tests now provision a full environment',
              metric: `+${(last.integration - first.integration).toFixed(1)} min · ${integrationShare}%`,
              detail: `The stage jumped about 10 weeks ago when ADR-035 rolled out ${adr35}. Runner memory had to be raised for it as well ${pr}. Test reliability did improve, so this was a real trade-off rather than a mistake.`,
            },
            {
              title: 'Build caching was lost when templates were centralized',
              metric: `+${(last.build - first.build).toFixed(1)} min · ${buildShare}%`,
              detail: `The build stage almost doubled about 16 weeks ago, when per-repository caches were dropped ${adr24}.`,
            },
            {
              title: 'Repositories and test suites are growing',
              metric: `+${(last.unit - first.unit).toFixed(1)} min · ${unitShare}%`,
              detail: `Unit test time is rising slowly with code size ${growth}. This is normal and is the smallest contributor.`,
            },
            {
              title: 'Every change runs every stage',
              detail: `Nearly a quarter of full runs only touch documentation or comments ${noise}, which adds queueing for everyone on the shared runner pool.`,
            },
          ],
        },
        {
          kind: 'paragraph',
          text: `This is starting to affect operations. During the latest route-engine incident, a rollback took 24 minutes because it went through the full pipeline ${incident}.`,
        },
        {
          kind: 'recommendations',
          title: 'Recommended actions',
          items: [
            { title: 'Shard integration tests and run them only for changed services', detail: `Largest single saving. Already chosen as the CI Modernization pilot ${kickoff}.`, ownerId: 'p-ravi' },
            { title: 'Restore image layer caching in the shared templates', detail: 'Should recover most of the build stage increase.', ownerId: 'p-ravi' },
            { title: 'Add path filters so documentation changes skip full pipelines', detail: 'Low effort. Frees runner capacity right away.', ownerId: 'p-elena' },
            { title: 'Create a fast rollback path that skips test stages', detail: 'Reduces incident duration regardless of the other work.', ownerId: 'p-maya' },
          ],
        },
      ],
      confidence: 'high',
      confidenceReason: 'The two step changes line up with dated decisions and appear in stage-level metrics.',
      sources: c.sources,
      entityIds: ['repo-ci-templates', 'adr-035', 'adr-024', 'proj-ci', 'p-ravi', 'team-platform'],
      followUps: [
        'Which projects are at risk?',
        'Why did we adopt ADR-035?',
        'Who owns ci-templates?',
      ],
      grounded: true,
    },
  };
}

/* ---------------------------------------------------------------- Blast radius */

export function blastRadiusAnswer(service: Service): Plan {
  const dependents = dependentsOf(service.id);
  const direct = dependents.filter((d) => d.hops === 1);
  const teams = unique(dependents.map((d) => d.service.teamId)).filter((id) => id !== service.teamId);
  const criticalCount = dependents.filter((d) => d.service.tier === 0).length;

  const c = new Citations();
  const graph = c.add({
    kind: 'graph', system: GRAPH_SYSTEM, title: `depends_on edges into ${service.name}`,
    excerpt: `${direct.length} direct and ${dependents.length - direct.length} transitive dependents found by walking the dependency graph.`,
  });
  const related = insightsFor([service.id]).slice(0, 2);
  const riskCites = related.map((insight) => citeEvidence(insight, c));

  const transitive = dependents.length - direct.length;
  const reach =
    transitive === 0
      ? `${dependents.length === 1 ? '1 service is' : `${dependents.length} services are`} affected directly`
      : `${dependents.length} services are affected: ${direct.length} directly and ${transitive} transitively`;
  const tiers =
    dependents.length === 1
      ? `It is ${criticalCount === 1 ? '' : 'not '}Tier 0.`
      : criticalCount === 0
        ? 'None of them are Tier 0.'
        : `${criticalCount} of them ${criticalCount === 1 ? 'is' : 'are'} Tier 0.`;

  const summary =
    dependents.length === 0
      ? `Nothing in the knowledge graph depends on ${service.name} ${graph}, so an outage would stay contained to consumers outside the modelled services.`
      : `If ${service.name} goes down, ${reach} ${graph}. ${tiers}`;

  const answer: AssistantAnswer = {
    summary,
    blocks: [],
    confidence: 'high',
    confidenceReason: 'Computed directly from dependency edges in the knowledge graph. Runtime fallback behaviour was not evaluated.',
    sources: c.sources,
    entityIds: unique([service.id, ...dependents.map((d) => d.service.id), service.teamId]),
    followUps: [`Who owns ${service.name}?`, `What decisions affect ${service.name}?`, 'Where are our biggest knowledge silos?'],
    grounded: true,
  };

  if (dependents.length > 0) {
    answer.blocks.push({
      kind: 'table',
      title: 'Affected services',
      columns: ['Service', 'Distance', 'Tier', 'Team', 'On call'],
      rows: dependents.map(({ service: s, hops }) => [
        { entityId: s.id },
        hops === 1 ? 'Direct' : `${hops} hops`,
        `Tier ${s.tier}`,
        { entityId: s.teamId },
        { entityId: s.onCallId },
      ]),
    });
  }
  answer.blocks.push({
    kind: 'recommendations',
    title: 'Who to involve',
    items: [
      { title: `Page the ${service.name} on-call first`, detail: `${teamName(service.teamId)} owns this service.`, ownerId: service.onCallId },
      ...(teams.length > 0
        ? [{ title: 'Notify the affected teams', detail: listOf(teams.map(teamName)) + '.' }]
        : []),
    ],
  });
  if (related.length > 0) {
    answer.blocks.push({
      kind: 'findings',
      title: 'Known risks on this service',
      items: related.map((insight, i) => ({ title: insight.title, detail: `${insight.summary} ${riskCites[i]}` })),
    });
  }

  return {
    steps: [
      step('locate', `Locating ${service.name} in the graph`, `Tier ${service.tier}, owned by ${teamName(service.teamId)}`),
      step('walk', 'Walking the dependency graph', `${dependents.length} dependents found`),
      step('owners', 'Resolving owners and on-call', `${teams.length + 1} teams involved`),
      step('risks', 'Checking open findings', `${related.length} related`),
    ],
    answer,
  };
}

/* ------------------------------------------------------------- Person departure */

export function departureAnswer(person: Person): Plan {
  const repos = directory.repositories.filter((r) => r.maintainerIds.includes(person.id));
  const majorRepos = repos.filter((r) => r.topContributorId === person.id);
  const otherRepos = repos.filter((r) => r.topContributorId !== person.id);
  const singleOwner = majorRepos.filter((r) => r.busFactor === 1);
  const onCall = directory.services.filter((s) => s.onCallId === person.id);
  const led = directory.projects.filter((p) => p.leadId === person.id && p.status !== 'completed');
  const leadOf = directory.teams.filter((t) => t.leadId === person.id);
  const authored = directory.decisions.filter((d) => d.authorIds.includes(person.id));
  const uniqueSkills = person.expertise.filter(
    (skill) => !directory.people.some((other) => other.id !== person.id && other.expertise.includes(skill)),
  );
  const successor =
    directory.repositories
      .filter((r) => majorRepos.includes(r))
      .flatMap((r) => r.maintainerIds)
      .find((id) => id !== person.id) ?? directory.people.find((p) => p.teamId === person.teamId && p.id !== person.id)?.id;

  const c = new Citations();
  const graphCite = c.add({
    kind: 'graph', system: GRAPH_SYSTEM, title: `Relationships of ${person.name}`,
    excerpt: `${repos.length} repositories maintained, ${onCall.length} on-call assignments, ${authored.length} decisions authored, ${led.length} active projects led.`,
  });
  const related = insightsFor([person.id]).slice(0, 2);
  const relatedCites = related.map((insight) => citeEvidence(insight, c)).join('');

  const when =
    person.status === 'departing' && person.lastDayAt
      ? `${person.name} leaves in ${Math.max(0, daysUntil(person.lastDayAt))} days.`
      : `${person.name} has no planned departure, so this is a hypothetical.`;

  const severe = singleOwner.length > 0 || onCall.some((s) => s.tier === 0);

  return {
    steps: [
      step('profile', `Reading ${person.name}'s graph neighborhood`, `${teamName(person.teamId)}, ${person.role}`),
      step('commits', 'Comparing commit share across repositories', `${majorRepos.length} repositories with this person as top contributor`),
      step('oncall', 'Checking on-call and project roles', `${onCall.length} on-call, ${led.length} projects led`),
      step('skills', 'Looking for overlapping expertise', `${uniqueSkills.length} skills not listed for anyone else`),
    ],
    answer: {
      summary: `${when} ${severe ? 'The impact would be high' : 'The impact looks manageable'}: this person is top contributor on ${majorRepos.length} ${majorRepos.length === 1 ? 'repository' : 'repositories'}${singleOwner.length > 0 ? `, ${singleOwner.length} with a bus factor of one` : ''}, and is on call for ${onCall.length} ${onCall.length === 1 ? 'service' : 'services'} ${graphCite}${relatedCites}.`,
      blocks: [
        {
          kind: 'table',
          title: 'What this person is carrying',
          columns: ['Item', 'Role', 'Exposure'],
          rows: [
            ...majorRepos.map((r) => [{ entityId: r.id }, `Top contributor, ${r.topContributorSharePct}% of commits`, `Bus factor ${r.busFactor}`]),
            ...otherRepos.map((r) => [{ entityId: r.id }, 'Maintainer', `Bus factor ${r.busFactor}`]),
            ...onCall.map((s) => [{ entityId: s.id }, 'On call', `Tier ${s.tier}, ${dependentsOf(s.id).length} dependents`]),
            ...led.map((p) => [{ entityId: p.id }, 'Project lead', `${p.progressPct}% complete`]),
            ...leadOf.map((t) => [{ entityId: t.id }, 'Team lead', 'People management']),
            ...authored.map((d) => [{ entityId: d.id }, 'Decision author', d.status]),
          ] as (string | { entityId: string })[][],
        },
        ...(uniqueSkills.length > 0
          ? [
              {
                kind: 'paragraph' as const,
                text: `No one else lists ${listOf(uniqueSkills)} as an area of expertise, so these are the areas to prioritize in any handover.`,
              },
            ]
          : []),
        {
          kind: 'recommendations',
          title: 'Recommended handover',
          items: [
            ...(singleOwner.length > 0
              ? [{ title: `Record walkthroughs of ${listOf(singleOwner.map((r) => r.name))}`, detail: 'Focus on the parts no one else has changed this year.', ownerId: person.id }]
              : []),
            ...(onCall.length > 0 && successor
              ? [{ title: `Move ${personName(successor)} onto the ${listOf(onCall.map((s) => s.name))} rotation now`, detail: 'Pair for the next two shifts.', ownerId: successor }]
              : []),
            ...(led.length > 0
              ? [{ title: `Name a new lead for ${listOf(led.map((p) => p.name))}`, ownerId: directory.teams.find((t) => t.id === person.teamId)?.leadId }]
              : []),
            ...(authored.length > 0
              ? [{ title: 'Capture the reasoning behind decisions that exists only in chat and code comments', detail: `${authored.map((d) => d.code).join(', ')}.` }]
              : []),
          ],
        },
      ],
      confidence: 'high',
      confidenceReason: 'Based on commit history, on-call schedules and project records in the graph.',
      sources: c.sources,
      entityIds: unique([person.id, person.teamId, ...majorRepos.map((r) => r.id), ...onCall.map((s) => s.id), ...led.map((p) => p.id)]),
      followUps: [
        ...onCall.slice(0, 1).map((s) => `What breaks if ${s.name} goes down?`),
        'Where are our biggest knowledge silos?',
        `Who else knows ${person.expertise[0]}?`,
      ],
      grounded: true,
    },
  };
}

/* ------------------------------------------------------------- Knowledge silos */

export function silosAnswer(): Plan {
  const siloRepos = directory.repositories
    .filter((r) => r.busFactor === 1)
    .sort((a, b) => b.topContributorSharePct - a.topContributorSharePct);
  const findings = insightsByCategory('knowledge_silo');

  const c = new Citations();
  const graphCite = c.add({
    kind: 'metric', system: 'GitHub', title: 'Commit share across all repositories, last 12 months',
    excerpt: `${siloRepos.length} of ${directory.repositories.length} repositories have a bus factor of one.`,
  });
  const cites = findings.map((f) => citeEvidence(f, c));
  const critical = findings[0];
  const ledgerIndex = findings.findIndex((f) => f.id === 'ins-ledger-silo');

  return {
    steps: [
      step('commits', 'Computing commit concentration', `${directory.repositories.length} repositories`),
      step('reviews', 'Reviewing who approves changes', 'Pull request reviews over 90 days'),
      step('oncall', 'Joining with on-call and service tier', 'Weighting by business criticality'),
      step('departures', 'Checking planned departures', '1 engineer leaving'),
    ],
    answer: {
      summary: `${siloRepos.length} of ${directory.repositories.length} repositories have a bus factor of one ${graphCite}.${ledgerIndex >= 0 ? ` The most urgent is ledger-core: it is Tier 0, and its main author leaves in 14 days ${cites[ledgerIndex]}.` : ''}`,
      blocks: [
        {
          kind: 'table',
          title: 'Repositories with a bus factor of one',
          columns: ['Repository', 'Top contributor', 'Commit share', 'Team'],
          rows: siloRepos.map((r) => [{ entityId: r.id }, { entityId: r.topContributorId }, `${r.topContributorSharePct}%`, { entityId: r.teamId }]),
        },
        {
          kind: 'findings',
          title: 'Why these matter',
          items: findings.map((f, i) => ({ title: f.title, detail: `${f.impact} ${cites[i]}` })),
        },
        {
          kind: 'recommendations',
          title: 'Recommended actions',
          items: (critical?.recommendations ?? []).map((title) => ({ title })),
        },
      ],
      confidence: 'high',
      confidenceReason: `Commit history and on-call records agree for all ${siloRepos.length} repositories.`,
      sources: c.sources,
      entityIds: unique([...siloRepos.map((r) => r.id), ...siloRepos.map((r) => r.topContributorId)]),
      followUps: ['What happens when Henrik Lindqvist leaves?', 'What happens if Priya Raman leaves?', 'What breaks if ledger-core goes down?'],
      grounded: true,
    },
  };
}

/* ------------------------------------------------------------------- Ownership */

export function ownershipAnswer(service?: Service, repoId?: string, focus: 'owner' | 'on_call' = 'owner'): Plan {
  const repo = repoById.get(service?.repositoryId ?? repoId ?? '');
  const serviceOfRepo = service ?? directory.services.find((s) => s.repositoryId === repo?.id);
  const name = service?.name ?? repo?.name ?? 'this system';
  const teamId = service?.teamId ?? repo?.teamId ?? '';
  const team = teamById.get(teamId);

  const c = new Citations();
  const cite = c.add({
    kind: 'graph', system: GRAPH_SYSTEM, title: `Ownership edges for ${name}`,
    excerpt: 'Combined from code owners, on-call schedules and team membership.',
  });

  const rows: (string | { entityId: string })[][] = [];
  if (team) rows.push(['Owning team', { entityId: team.id }]);
  if (team) rows.push(['Team lead', { entityId: team.leadId }]);
  if (serviceOfRepo) rows.push(['On call', { entityId: serviceOfRepo.onCallId }]);
  if (repo) {
    rows.push(['Top contributor', { entityId: repo.topContributorId }]);
    for (const id of repo.maintainerIds) rows.push(['Maintainer', { entityId: id }]);
    rows.push(['Repository', { entityId: repo.id }]);
  }

  const expert = repo ? personName(repo.topContributorId) : undefined;
  const onCall = serviceOfRepo ? personById.get(serviceOfRepo.onCallId) : undefined;

  const ownerSummary = `${team?.name ?? 'Unknown team'} owns ${name} ${cite}.${expert ? ` For technical questions, start with ${expert}, who wrote ${repo?.topContributorSharePct}% of recent commits.` : ''}`;
  const onCallSummary = onCall
    ? `${onCall.name} is on call for ${name} ${cite}. ${team?.name} owns the service.${onCall.status === 'departing' && onCall.lastDayAt ? ` ${onCall.name} leaves in ${daysUntil(onCall.lastDayAt)} days, so this rotation needs a new person.` : ''}`
    : `No on-call schedule is recorded for ${name} ${cite}. ${team?.name} owns it.`;

  return {
    steps: [
      step('locate', `Locating ${name} in the graph`, team?.name ?? ''),
      step('owners', 'Resolving code owners and on-call', `${repo?.maintainerIds.length ?? 0} maintainers`),
    ],
    answer: {
      summary: focus === 'on_call' ? onCallSummary : ownerSummary,
      blocks: [{ kind: 'table', title: 'People and teams', columns: ['Role', 'Who'], rows }],
      confidence: 'high',
      confidenceReason: 'Ownership is recorded directly in the graph.',
      sources: c.sources,
      entityIds: unique([...(service ? [service.id] : []), ...(repo ? [repo.id] : []), teamId]),
      followUps: serviceOfRepo
        ? [`What breaks if ${serviceOfRepo.name} goes down?`, `What decisions affect ${serviceOfRepo.name}?`]
        : ['Where are our biggest knowledge silos?'],
      grounded: true,
    },
  };
}

const EXPERTISE_STOPWORDS = new Set([
  'who', 'knows', 'know', 'about', 'the', 'what', 'should', 'talk', 'ask', 'expert', 'experts', 'help',
  'with', 'our', 'can', 'for', 'and', 'best', 'person', 'else', 'most', 'understands', 'understand', 'anyone', 'someone', 'here',
  'does', 'has', 'experience', 'in', 'is', 'an', 'a', 'of', 'on', 'to', 'at', 'we', 'do', 'are', 'there', 'any', 'whom', 'people',
]);

/** Whole words only, so that a short word such as "an" cannot match inside "planning". */
function skillMatches(skill: string, token: string): boolean {
  return skill
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .some(
      (word) =>
        word === token ||
        (token.length >= 3 && word.length >= 3 && (word.startsWith(token) || token.startsWith(word))),
    );
}

export function expertiseAnswer(question: string): Plan | undefined {
  const tokens = question
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter((token) => token.length > 1 && !EXPERTISE_STOPWORDS.has(token));
  if (tokens.length === 0) return undefined;

  // Someone who is leaving should not be the first recommendation, however expert.
  const scored = directory.people
    .map((person) => ({
      person,
      matched: person.expertise.filter((skill) => tokens.some((token) => skillMatches(skill, token))),
    }))
    .filter((row) => row.matched.length > 0)
    .sort(
      (a, b) =>
        Number(a.person.status === 'departing') - Number(b.person.status === 'departing') ||
        b.matched.length - a.matched.length,
    );

  if (scored.length === 0) return undefined;

  const leaving = scored.filter((row) => row.person.status === 'departing' && row.person.lastDayAt);
  const leavingNote = leaving
    .map((row) => ` ${row.person.name} also knows this, but leaves in ${daysUntil(row.person.lastDayAt as string)} days.`)
    .join('');

  const c = new Citations();
  const cite = c.add({
    kind: 'graph', system: GRAPH_SYSTEM, title: 'Expertise inferred from contributions',
    excerpt: 'Expertise tags come from commit history, code review activity and authored decisions.',
  });
  const top = scored[0];

  return {
    steps: [
      step('match', 'Matching expertise signals', `${scored.length} people matched`),
      step('rank', 'Ranking by depth of contribution', 'Commits, reviews and authored decisions'),
    ],
    answer: {
      summary:
        leaving.length === scored.length
          ? `Only ${top.person.name} (${teamName(top.person.teamId)}) has this expertise ${cite}, and they leave in ${daysUntil(top.person.lastDayAt as string)} days. This knowledge needs a handover now.`
          : `Start with ${top.person.name} (${teamName(top.person.teamId)}) ${cite}.${leavingNote}${
              scored.length - leaving.length > 1
                ? ` ${scored.length - leaving.length - 1} other ${scored.length - leaving.length === 2 ? 'person also matches' : 'people also match'}.`
                : scored.length === 1
                  ? ' Nobody else matches, which may be a knowledge silo.'
                  : ''
            }`,
      blocks: [
        {
          kind: 'table',
          title: 'People with matching expertise',
          columns: ['Person', 'Team', 'Matching expertise'],
          rows: scored.map(({ person, matched }) => [{ entityId: person.id }, { entityId: person.teamId }, matched.join(', ')]),
        },
      ],
      confidence: 'medium',
      confidenceReason: 'Expertise tags are inferred signals and may not reflect current availability.',
      sources: c.sources,
      entityIds: scored.slice(0, 6).map((row) => row.person.id),
      followUps: [`What happens if ${top.person.name} leaves?`, 'Where are our biggest knowledge silos?'],
      grounded: true,
    },
  };
}

/* ------------------------------------------------------------------- Decisions */

function decisionBlocks(decision: Decision, cite: string): AssistantAnswer['blocks'] {
  return [
    {
      kind: 'findings',
      title: decision.title,
      items: [
        { title: 'Context', detail: `${decision.context} ${cite}` },
        { title: 'Outcome', detail: decision.outcome },
      ],
    },
    {
      kind: 'table',
      title: 'Alternatives considered',
      columns: ['Option', 'Status'],
      rows: [[decision.title, 'Chosen'], ...decision.alternatives.map((alt) => [alt, 'Rejected'])],
    },
  ];
}

const DECISION_STOPWORDS = new Set([
  'what', 'when', 'where', 'which', 'with', 'from', 'that', 'this', 'have', 'been', 'were', 'more', 'most', 'make',
  'made', 'move', 'moved', 'adopt', 'choose', 'chose', 'decide', 'decided', 'decision', 'decisions', 'about', 'they', 'them',
]);

export function decisionAnswer(question: string, mentioned?: Decision, service?: Service): Plan | undefined {
  const words = question
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .filter((w) => w.length > 3 && !DECISION_STOPWORDS.has(w));

  const scored = directory.decisions
    .map((decision) => {
      const haystack = `${decision.title} ${decision.context} ${decision.outcome}`.toLowerCase();
      let score = words.filter((word) => haystack.includes(word)).length;
      if (service && decision.serviceIds.includes(service.id)) score += 3;
      return { decision, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  const decision = mentioned ?? scored[0]?.decision;
  if (!decision) return undefined;

  const c = new Citations();
  const cite = c.add({
    kind: 'adr', system: decision.source, title: `${decision.code}: ${decision.title}`,
    excerpt: decision.context, occurredAt: decision.decidedAt,
  });

  // A question about a service gets all of its decisions.
  const others = service
    ? directory.decisions.filter((d) => d.serviceIds.includes(service.id) && d.id !== decision.id)
    : [];
  const superseded = decision.supersededById ? decisionById.get(decision.supersededById) : undefined;

  return {
    steps: [
      step('search', 'Searching decision records', `${directory.decisions.length} decisions`),
      step('context', `Reading ${decision.code} and related discussion`, listOf(decision.authorIds.map(personName))),
      step('links', 'Tracing affected systems', `${decision.serviceIds.length + decision.repositoryIds.length} linked`),
    ],
    answer: {
      summary: `${decision.code} records this decision. ${decision.context} ${cite} It was written by ${listOf(decision.authorIds.map(personName))}, and its status is ${decision.status}.${superseded ? ` It has since been superseded by ${superseded.code}.` : ''}`,
      blocks: [
        ...decisionBlocks(decision, cite),
        ...(others.length > 0
          ? [
              {
                kind: 'table' as const,
                title: `Other decisions affecting ${service?.name}`,
                columns: ['Decision', 'Status'],
                rows: others.map((d) => [{ entityId: d.id }, d.status]),
              },
            ]
          : []),
      ],
      confidence: 'high',
      confidenceReason: 'Taken from a recorded decision document.',
      sources: c.sources,
      entityIds: unique([decision.id, ...decision.authorIds, ...decision.serviceIds, ...decision.repositoryIds]),
      followUps: [
        ...decision.serviceIds.slice(0, 1).map((id) => `What breaks if ${serviceName(id)} goes down?`),
        ...decision.authorIds.slice(0, 1).map((id) => `What happens if ${personName(id)} leaves?`),
      ],
      grounded: true,
    },
  };
}

/* -------------------------------------------------------------------- Projects */

export function projectsAnswer(): Plan {
  const attention = directory.projects
    .filter((p) => p.status === 'at_risk' || p.status === 'blocked')
    .sort((a, b) => a.targetAt.localeCompare(b.targetAt));
  const onTrack = directory.projects.filter((p) => p.status === 'on_track');

  const c = new Citations();
  const cite = c.add({
    kind: 'graph', system: GRAPH_SYSTEM, title: 'Project status and linked findings',
    excerpt: `${directory.projects.length} projects evaluated, using status records, linked pull requests and open findings.`,
  });
  const related = insightsFor(attention.map((p) => p.id)).slice(0, 3);
  const riskCites = related.map((r) => citeEvidence(r, c));

  return {
    steps: [
      step('load', 'Loading project records', `${directory.projects.length} projects`),
      step('join', 'Joining with open findings', `${related.length} high-severity links`),
      step('people', 'Checking lead availability', 'One lead departing'),
    ],
    answer: {
      summary: `${attention.length} of ${directory.projects.length} projects need attention ${cite}. Another ${onTrack.length} are on track. The nearest deadline at risk is ${attention[0]?.name}, due in ${Math.round((new Date(attention[0].targetAt).getTime() - Date.now()) / 86_400_000)} days.`,
      blocks: [
        {
          kind: 'table',
          title: 'Projects needing attention',
          columns: ['Project', 'Status', 'Progress', 'Lead', 'Why'],
          rows: attention.map((p) => [{ entityId: p.id }, p.status === 'blocked' ? 'Blocked' : 'At risk', `${p.progressPct}%`, { entityId: p.leadId }, p.statusNote]),
        },
        {
          kind: 'findings',
          title: 'Related findings',
          items: related.map((r, i) => ({ title: r.title, detail: `${r.summary} ${riskCites[i]}` })),
        },
      ],
      confidence: 'medium',
      confidenceReason: 'Status comes from project records, which depend on teams keeping them up to date.',
      sources: c.sources,
      entityIds: attention.map((p) => p.id),
      followUps: ['What happens when Henrik Lindqvist leaves?', 'Why has deployment time increased?', 'What duplicate work is happening across teams?'],
      grounded: true,
    },
  };
}

/* ------------------------------------------------------------------ Onboarding */

export function onboardingAnswer(team: Team): Plan {
  const members = directory.people.filter((p) => p.teamId === team.id);
  const services = directory.services.filter((s) => s.teamId === team.id).sort((a, b) => a.tier - b.tier);
  const repos = directory.repositories.filter((r) => r.teamId === team.id);
  const projects = directory.projects.filter((p) => p.teamIds.includes(team.id) && p.status !== 'completed');
  const decisions = directory.decisions.filter(
    (d) => d.serviceIds.some((id) => serviceById.get(id)?.teamId === team.id) && d.status !== 'superseded',
  );
  const stale = services.filter((s) => Date.now() - new Date(s.docsUpdatedAt).getTime() > 90 * 86_400_000);

  const c = new Citations();
  const cite = c.add({
    kind: 'graph', system: GRAPH_SYSTEM, title: `${team.name} neighborhood`,
    excerpt: `${members.length} people, ${services.length} services, ${repos.length} repositories, ${decisions.length} active decisions.`,
  });

  return {
    steps: [
      step('team', `Reading the ${team.name} neighborhood`, `${members.length} people`),
      step('systems', 'Ranking systems by tier', `${services.length} services`),
      step('decisions', 'Selecting decisions worth reading', `${decisions.length} decisions`),
      step('docs', 'Checking documentation freshness', `${stale.length} stale`),
    ],
    answer: {
      summary: `${team.name}: ${team.mission} ${cite} Here is a suggested first week, based on what the team owns and what is changing now.`,
      blocks: [
        {
          kind: 'recommendations',
          title: 'People to meet first',
          items: members.slice(0, 4).map((p) => ({ title: p.name, detail: `${p.role}. ${p.expertise.slice(0, 3).join(', ')}.`, ownerId: p.id })),
        },
        {
          kind: 'table',
          title: 'Systems to learn, most critical first',
          columns: ['Service', 'Tier', 'On call', 'Docs'],
          rows: services.map((s) => [
            { entityId: s.id },
            `Tier ${s.tier}`,
            { entityId: s.onCallId },
            stale.includes(s) ? 'Stale, verify with the team' : 'Current',
          ]),
        },
        {
          kind: 'table',
          title: 'Decisions to read',
          columns: ['Decision', 'Status'],
          rows: decisions.map((d) => [{ entityId: d.id }, d.status]),
        },
        {
          kind: 'table',
          title: 'What the team is working on',
          columns: ['Project', 'Progress', 'Lead'],
          rows: projects.map((p) => [{ entityId: p.id }, `${p.progressPct}%`, { entityId: p.leadId }]),
        },
      ],
      confidence: 'high',
      confidenceReason: 'Built from team ownership records in the graph.',
      sources: c.sources,
      entityIds: unique([team.id, ...services.map((s) => s.id), ...repos.map((r) => r.id)]),
      followUps: services.slice(0, 1).flatMap((s) => [`What breaks if ${s.name} goes down?`, `Who owns ${s.name}?`]),
      grounded: true,
    },
  };
}

/* ------------------------------------------------------- Findings by category */

const CATEGORY_TITLES: Record<InsightCategory, string> = {
  tech_debt: 'technical debt',
  outdated_docs: 'outdated documentation',
  knowledge_silo: 'knowledge silos',
  duplicate_work: 'duplicate work',
  deployment_risk: 'deployment risks',
  dependency_issue: 'dependency issues',
};

const CATEGORY_QUESTIONS: Record<InsightCategory, string> = {
  tech_debt: 'What tech debt do we have?',
  outdated_docs: 'Which documents are outdated?',
  knowledge_silo: 'Where are our biggest knowledge silos?',
  duplicate_work: 'What duplicate work is happening across teams?',
  deployment_risk: 'What deployment risks do we have?',
  dependency_issue: 'Do we have any vulnerable dependencies?',
};

/** One finding in full, for "Ask OrgMind" on that finding. */
export function findingAnswer(insight: Insight): Plan {
  const c = new Citations();
  const cites = citeEvidence(insight, c);
  const pct = Math.round(insight.confidence * 100);
  const evidenceCount = insight.evidence.length === 1 ? '1 piece of evidence' : `${insight.evidence.length} pieces of evidence`;
  const statusNote = insight.status === 'open' ? '' : ` This finding is marked as ${insight.status}.`;
  const service = insight.entityIds.map((id) => serviceById.get(id)).find((s) => s !== undefined);

  return {
    steps: [
      step('finding', 'Reading the finding', `${insight.severity} severity, ${pct}% confidence`),
      step('evidence', 'Collecting its evidence', evidenceCount),
      step('owner', 'Resolving the owner', teamName(insight.ownerTeamId)),
    ],
    answer: {
      summary: `${insight.summary} ${cites}${statusNote}`,
      blocks: [
        { kind: 'paragraph', text: `Why it matters: ${insight.impact}` },
        {
          kind: 'recommendations',
          title: 'Recommended actions',
          items: insight.recommendations.map((title) => ({ title })),
        },
      ],
      confidence: pct >= 85 ? 'high' : pct >= 60 ? 'medium' : 'low',
      confidenceReason: `Detected with ${pct}% confidence from ${evidenceCount}.`,
      sources: c.sources,
      entityIds: unique(insight.entityIds),
      followUps: [
        ...(service ? [`What breaks if ${service.name} goes down?`, `Who owns ${service.name}?`] : []),
        CATEGORY_QUESTIONS[insight.category],
      ],
      grounded: true,
    },
  };
}

export function categoryAnswer(category: InsightCategory): Plan {
  const findings = insightsByCategory(category);
  const c = new Citations();
  const cites = findings.map((f) => citeEvidence(f, c));
  const top = findings[0];
  const label = CATEGORY_TITLES[category];

  return {
    steps: [
      step('scan', 'Reading proactive findings', `${findings.length} active in this category`),
      step('evidence', 'Collecting evidence', `${c.sources.length} sources`),
      step('rank', 'Ranking by severity', 'Weighted by service tier'),
    ],
    answer: {
      summary: top
        ? `OrgMind found ${findings.length} active ${findings.length === 1 ? 'finding' : 'findings'} for ${label}. The most serious: ${top.title} ${cites[0]}.`
        : `OrgMind has no active findings for ${label} right now.`,
      blocks: [
        {
          kind: 'findings',
          title: `Findings: ${label}`,
          items: findings.map((f, i) => ({ title: f.title, metric: f.severity, detail: `${f.summary} ${cites[i]}` })),
        },
        {
          kind: 'recommendations',
          title: 'Where to start',
          items: (top?.recommendations ?? []).map((title) => ({ title })),
        },
      ],
      confidence: 'high',
      confidenceReason: top ? 'Each finding carries its own evidence and detection confidence.' : 'Read from the current status of every finding.',
      sources: c.sources,
      entityIds: unique(findings.flatMap((f) => f.entityIds)).slice(0, 8),
      followUps: ['Which projects are at risk?', 'Where are our biggest knowledge silos?', 'Why has deployment time increased?'],
      grounded: true,
    },
  };
}

export function topRisksAnswer(): Plan {
  const open = currentInsights().filter((i) => i.status === 'open');
  const top = [...open].sort(bySeverity).slice(0, 5);
  const c = new Citations();
  const cites = top.map((f) => citeEvidence(f, c));

  return {
    steps: [
      step('scan', 'Reading all open findings', `${open.length} open`),
      step('rank', 'Ranking by severity and service tier', 'Top five kept'),
    ],
    answer: {
      summary: top[0]
        ? `The most severe open finding right now: ${top[0].title} ${cites[0]}.${top.length > 1 ? ` These are the top ${top.length}.` : ''}`
        : 'No findings are open right now, so nothing stands out as a risk.',
      blocks: [
        {
          kind: 'findings',
          title: 'Most severe open findings',
          items: top.map((f, i) => ({ title: f.title, metric: f.severity, detail: `${f.impact} ${cites[i]}` })),
        },
      ],
      confidence: 'high',
      confidenceReason: top[0] ? 'Ranked from existing findings by severity.' : 'Read from the current status of every finding.',
      sources: c.sources,
      entityIds: unique(top.flatMap((f) => f.entityIds)).slice(0, 8),
      followUps: ['What happens when Henrik Lindqvist leaves?', 'Which projects are at risk?'],
      grounded: true,
    },
  };
}

/* ---------------------------------------------------------------- Entity brief */

export function serviceBrief(service: Service): Plan {
  const dependents = dependentsOf(service.id);
  const dependencies = service.dependsOn.map(serviceName);
  const related = insightsFor([service.id]);
  const c = new Citations();
  const cite = c.add({
    kind: 'graph', system: GRAPH_SYSTEM, title: `${service.name} neighborhood`,
    excerpt: `${dependencies.length} dependencies and ${dependents.length} dependents.`,
  });

  return {
    steps: [
      step('locate', `Locating ${service.name}`, `Tier ${service.tier}, ${service.runtime}`),
      step('edges', 'Reading dependencies', `${dependencies.length} upstream, ${dependents.length} downstream`),
      step('findings', 'Checking open findings', `${related.length} related`),
    ],
    answer: {
      summary: `${service.name}: ${service.description} It is a Tier ${service.tier} ${service.runtime} service owned by ${teamName(service.teamId)} ${cite}.`,
      blocks: [
        {
          kind: 'table',
          title: 'At a glance',
          columns: ['Property', 'Value'],
          rows: [
            ['On call', { entityId: service.onCallId }],
            ['Depends on', dependencies.length ? dependencies.join(', ') : 'Nothing modelled'],
            ['Depended on by', dependents.length ? dependents.map((d) => d.service.name).join(', ') : 'Nothing modelled'],
            ['Deploys per week', String(service.deploysPerWeek)],
            ['p95 latency', `${service.p95Ms} ms`],
            ['Error rate', `${service.errorRatePct}%`],
          ],
        },
        ...(related.length > 0
          ? [
              {
                kind: 'findings' as const,
                title: 'Open findings',
                items: related.slice(0, 4).map((r) => ({ title: r.title, metric: r.severity, detail: r.summary })),
              },
            ]
          : []),
      ],
      confidence: 'high',
      confidenceReason: 'Read directly from the graph.',
      sources: c.sources,
      entityIds: unique([service.id, service.teamId, service.repositoryId, ...service.dependsOn]),
      followUps: [`What breaks if ${service.name} goes down?`, `Who owns ${service.name}?`, `What decisions affect ${service.name}?`],
      grounded: true,
    },
  };
}

const DECISION_ORDER = { accepted: 0, proposed: 1, superseded: 2 } as const;

/** Every recorded decision that affects a service, current ones first. */
export function serviceDecisionsAnswer(service: Service): Plan {
  const related = directory.decisions
    .filter((d) => d.serviceIds.includes(service.id))
    .sort((a, b) => DECISION_ORDER[a.status] - DECISION_ORDER[b.status] || b.decidedAt.localeCompare(a.decidedAt));
  const current = related[0];

  const c = new Citations();
  const cite = c.add({
    kind: 'graph', system: GRAPH_SYSTEM, title: `Decisions linked to ${service.name}`,
    excerpt: `${related.length} decisions govern this service.`,
  });
  const docCite = current
    ? c.add({ kind: 'adr', system: current.source, title: `${current.code}: ${current.title}`, excerpt: current.context, occurredAt: current.decidedAt })
    : '';

  return {
    steps: [
      step('locate', `Locating ${service.name}`, teamName(service.teamId)),
      step('links', 'Following decision links', `${related.length} found`),
    ],
    answer: {
      summary: current
        ? `${related.length} recorded ${related.length === 1 ? 'decision affects' : 'decisions affect'} ${service.name} ${cite}. The most relevant is ${current.code}: ${current.title} ${docCite}.`
        : `No recorded decisions are linked to ${service.name} ${cite}. That may mean the reasoning behind it was never written down.`,
      blocks: current
        ? [
            {
              kind: 'table',
              title: `Decisions affecting ${service.name}`,
              columns: ['Decision', 'Status'],
              rows: related.map((d) => [{ entityId: d.id }, d.status]),
            },
            ...decisionBlocks(current, docCite),
          ]
        : [],
      confidence: current ? 'high' : 'medium',
      confidenceReason: current ? 'Taken from recorded decision documents.' : 'Decisions made in chat or meetings may not have been captured.',
      sources: c.sources,
      entityIds: unique([service.id, ...related.map((d) => d.id)]),
      followUps: [`What breaks if ${service.name} goes down?`, `Who owns ${service.name}?`],
      grounded: true,
    },
  };
}

const PROJECT_STATUS_TEXT: Record<Project['status'], string> = {
  on_track: 'on track',
  at_risk: 'at risk',
  blocked: 'blocked',
  completed: 'completed',
};

export function projectAnswer(project: Project): Plan {
  const days = daysUntil(project.targetAt);
  const related = insightsFor([project.id]);
  const c = new Citations();
  const cite = c.add({
    kind: 'graph', system: GRAPH_SYSTEM, title: `${project.name} status record`,
    excerpt: `${project.progressPct}% complete. ${project.statusNote}`,
  });
  const riskCites = related.map((r) => citeEvidence(r, c));
  const timing = days >= 0 ? `The target is in ${days} days.` : `It finished ${Math.abs(days)} days ago.`;

  return {
    steps: [
      step('locate', `Reading the ${project.name} record`, `${project.progressPct}% complete`),
      step('links', 'Checking linked services and teams', `${project.serviceIds.length} services, ${project.teamIds.length} teams`),
      step('findings', 'Looking for open findings', `${related.length} related`),
    ],
    answer: {
      summary: `${project.name} is ${PROJECT_STATUS_TEXT[project.status]} at ${project.progressPct}% ${cite}. ${timing} ${project.statusNote}`,
      blocks: [
        {
          kind: 'table',
          title: 'Project details',
          columns: ['Property', 'Value'],
          rows: [
            ['Lead', { entityId: project.leadId }],
            ...project.teamIds.map((id) => ['Team', { entityId: id }]),
            ...project.serviceIds.map((id) => ['Changes', { entityId: id }]),
          ],
        },
        ...(related.length > 0
          ? [
              {
                kind: 'findings' as const,
                title: 'Open findings on this project',
                items: related.map((r, i) => ({ title: r.title, metric: r.severity, detail: `${r.summary} ${riskCites[i]}` })),
              },
            ]
          : []),
      ],
      confidence: 'medium',
      confidenceReason: 'Status comes from the project record, which depends on the team keeping it up to date.',
      sources: c.sources,
      entityIds: unique([project.id, project.leadId, ...project.teamIds]),
      followUps: ['Which projects are at risk?', `What happens if ${personName(project.leadId)} leaves?`],
      grounded: true,
    },
  };
}

/** Finds real cycles by walking the dependency graph, starting from each service. */
function findDependencyCycles(): Service[][] {
  const order = new Map(directory.services.map((s, i) => [s.id, i]));
  const cycles: Service[][] = [];

  const walk = (start: string, current: string, path: string[]) => {
    for (const next of serviceById.get(current)?.dependsOn ?? []) {
      if (next === start) {
        cycles.push(path.map((id) => serviceById.get(id) as Service));
      } else if (!path.includes(next) && (order.get(next) ?? 0) > (order.get(start) ?? 0)) {
        // Only moving to later services means that each cycle is found once, from its first member.
        walk(start, next, [...path, next]);
      }
    }
  };
  for (const service of directory.services) walk(service.id, service.id, [service.id]);
  return cycles;
}

export function cyclesAnswer(): Plan {
  const cycles = findDependencyCycles();
  const describe = (cycle: Service[]) => [...cycle, cycle[0]].map((s) => s.name).join(' → ');

  const c = new Citations();
  const cite = c.add({
    kind: 'graph', system: GRAPH_SYSTEM, title: 'Cycle search over depends_on edges',
    excerpt: `${directory.services.length} services searched. ${cycles.length} ${cycles.length === 1 ? 'cycle' : 'cycles'} found.`,
  });
  const members = unique(cycles.flat().map((s) => s.id));
  const related = insightsFor(members).filter((i) => i.category === 'dependency_issue' && i.title.toLowerCase().includes('circular'));
  const relatedCites = related.map((r) => citeEvidence(r, c));

  return {
    steps: [
      step('load', 'Loading service dependencies', `${directory.services.length} services`),
      step('search', 'Searching for cycles', `${cycles.length} found`),
      step('impact', 'Checking incidents and findings', `${related.length} related`),
    ],
    answer: {
      summary:
        cycles.length === 0
          ? `No. The ${directory.services.length} modelled services have no circular dependencies ${cite}.`
          : `Yes. There ${cycles.length === 1 ? 'is 1 dependency cycle' : `are ${cycles.length} dependency cycles`}: ${cycles.map(describe).join('; ')} ${cite}.`,
      blocks:
        cycles.length === 0
          ? []
          : [
              {
                kind: 'table',
                title: 'Services in a cycle',
                columns: ['Service', 'Team', 'Tier'],
                rows: members.map((id) => {
                  const s = serviceById.get(id) as Service;
                  return [{ entityId: s.id }, { entityId: s.teamId }, `Tier ${s.tier}`];
                }),
              },
              ...related.flatMap((r, i) => [
                {
                  kind: 'findings' as const,
                  title: 'Why it matters',
                  items: [{ title: r.title, detail: `${r.impact} ${relatedCites[i]}` }],
                },
                {
                  kind: 'recommendations' as const,
                  title: 'Recommended actions',
                  items: r.recommendations.map((title) => ({ title })),
                },
              ]),
            ],
      confidence: 'high',
      confidenceReason: 'Computed from dependency edges in the knowledge graph.',
      sources: c.sources,
      entityIds: members,
      followUps: members.slice(0, 1).map((id) => `What breaks if ${serviceName(id)} goes down?`).concat('Do we have any vulnerable dependencies?'),
      grounded: true,
    },
  };
}

export function personBrief(person: Person): Plan {
  const repos = directory.repositories.filter((r) => r.maintainerIds.includes(person.id));
  const onCall = directory.services.filter((s) => s.onCallId === person.id);
  const led = directory.projects.filter((p) => p.leadId === person.id && p.status !== 'completed');

  const c = new Citations();
  const cite = c.add({
    kind: 'graph', system: GRAPH_SYSTEM, title: `Relationships of ${person.name}`,
    excerpt: `${repos.length} repositories maintained, ${onCall.length} on-call assignments, ${led.length} active projects led.`,
  });

  return {
    steps: [step('locate', `Reading ${person.name}'s graph neighborhood`, teamName(person.teamId))],
    answer: {
      summary: `${person.name} is ${/^[aeiou]/i.test(person.role) ? 'an' : 'a'} ${person.role} on ${teamName(person.teamId)}, based in ${person.location} ${cite}. Areas of expertise: ${listOf(person.expertise)}.`,
      blocks: [
        {
          kind: 'table',
          title: 'Current responsibilities',
          columns: ['Item', 'Role'],
          rows: [
            ...repos.map((r) => [{ entityId: r.id }, r.topContributorId === person.id ? 'Top contributor' : 'Maintainer']),
            ...onCall.map((s) => [{ entityId: s.id }, 'On call']),
            ...led.map((p) => [{ entityId: p.id }, 'Project lead']),
          ] as (string | { entityId: string })[][],
        },
      ],
      confidence: 'high',
      confidenceReason: 'Read directly from the graph.',
      sources: c.sources,
      entityIds: unique([person.id, person.teamId]),
      followUps: [`What happens if ${person.name} leaves?`, `Who else knows ${person.expertise[0]}?`],
      grounded: true,
    },
  };
}

export function ungroundedAnswer(question: string): Plan {
  return {
    steps: [
      step('search', 'Searching the knowledge graph', 'No entity or topic matched'),
    ],
    answer: {
      summary: `I could not find anything in the organizational data that answers “${question}”, so I would rather not guess.`,
      blocks: [
        {
          kind: 'paragraph',
          text: 'I can reason about people, teams, projects, services, repositories and technical decisions. Try naming one of these, or start from a suggestion below.',
        },
      ],
      confidence: 'low',
      confidenceReason: 'No supporting evidence was found.',
      sources: [],
      entityIds: [],
      followUps: ['Why has deployment time increased?', 'What breaks if route-engine goes down?', 'Who owns billing-service?'],
      grounded: false,
    },
  };
}
