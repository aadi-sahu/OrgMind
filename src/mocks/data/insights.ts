import type { Insight } from '@/api/types';
import { daysAgo, hoursAgo, minutesAgo } from './time';

export const insights: Insight[] = [
  /* ---------------------------------------------------------- Knowledge silos */
  {
    id: 'ins-ledger-silo', category: 'knowledge_silo', severity: 'critical', status: 'open',
    title: 'ledger-core knowledge leaves with one person in 14 days',
    summary: 'Henrik Lindqvist wrote 91% of ledger-core commits in the last 12 months and is its only on-call engineer. Their last day is in 14 days.',
    impact: 'Tier 0 service. billing-service and payments-gateway both depend on it, and month-end close cannot run without it.',
    detectedAt: hoursAgo(6), confidence: 0.96, ownerTeamId: 'team-payments',
    entityIds: ['svc-ledger', 'repo-ledger', 'p-henrik', 'p-fatima', 'proj-ledger'],
    evidence: [
      { kind: 'metric', system: 'GitHub', title: 'Commit share, last 12 months', excerpt: 'Henrik Lindqvist 91%, Fatima Al-Sayed 6%, Noah Greenberg 3%.', occurredAt: hoursAgo(6) },
      { kind: 'message', system: 'Slack', title: '#team-payments thread on the ledger handover', excerpt: 'Reconciliation walkthrough still needs a date. It is the part nobody else has touched.', occurredAt: daysAgo(1) },
      { kind: 'document', system: 'Notion', title: 'Ledger reconciliation design', excerpt: 'Sole author and last editor is Henrik Lindqvist. Not reviewed by anyone else this year.', occurredAt: daysAgo(96) },
      { kind: 'graph', system: 'Knowledge graph', title: 'Dependents of ledger-core', excerpt: 'Direct: billing-service, payments-gateway. Transitive: api-gateway.' },
    ],
    recommendations: [
      'Schedule the reconciliation walkthrough this week and record it.',
      'Put Fatima Al-Sayed on the next two ledger-core on-call shifts, paired with Henrik.',
      'Name a new lead for the Ledger Double-Entry Migration before the last day.',
    ],
  },
  {
    id: 'ins-route-silo', category: 'knowledge_silo', severity: 'high', status: 'open',
    title: 'route-engine has a bus factor of one',
    summary: 'Priya Raman wrote 84% of route-engine commits and reviews nearly every solver change. Only two engineers have production Rust experience.',
    impact: 'The team cannot safely change the solver when Priya is unavailable, while Route Engine v3 is at risk.',
    detectedAt: daysAgo(2), confidence: 0.91, ownerTeamId: 'team-routing',
    entityIds: ['repo-route-engine', 'svc-route-engine', 'p-priya', 'p-liam', 'adr-018'],
    evidence: [
      { kind: 'metric', system: 'GitHub', title: 'Commit share, last 12 months', excerpt: "Priya Raman 84%, Liam O'Connell 13%, others 3%." },
      { kind: 'metric', system: 'GitHub', title: 'Review load on solver paths', excerpt: 'Priya Raman reviewed 92% of pull requests touching solver/ in the last 90 days.' },
      { kind: 'adr', system: 'GitHub', title: 'ADR-018: Rewrite the routing hot path in Rust', excerpt: 'Consequences section notes that Rust experience is limited to two engineers.', occurredAt: daysAgo(340) },
    ],
    recommendations: [
      "Route solver reviews to Liam O'Connell first, with Priya as the second reviewer.",
      'Write a solver architecture guide as part of the v3 work.',
      'Add a second engineer to the route-engine on-call rotation.',
    ],
  },
  {
    id: 'ins-edi-silo', category: 'knowledge_silo', severity: 'medium', status: 'acknowledged',
    title: 'edi-translator is understood by one engineer',
    summary: 'Marek Novak wrote 96% of the commits on edi-translator and is its only maintainer.',
    impact: 'Lower urgency while the service is scheduled for retirement, but that project is blocked.',
    detectedAt: daysAgo(12), confidence: 0.94, ownerTeamId: 'team-carrier',
    entityIds: ['repo-edi', 'svc-edi', 'p-marek', 'proj-edi-retire'],
    evidence: [
      { kind: 'metric', system: 'GitLab', title: 'Commit share, last 12 months', excerpt: 'Marek Novak 96%, Sofia Marin 4%.' },
      { kind: 'ticket', system: 'Jira', title: 'CAR-1182: EDI on-call coverage', excerpt: 'Open for 5 months with no second engineer assigned.', occurredAt: daysAgo(150) },
    ],
    recommendations: [
      'Document the carrier-specific mapping rules while the service is still running.',
      'Assign a backup for the remaining life of the service.',
    ],
  },

  /* --------------------------------------------------------- Deployment risks */
  {
    id: 'ins-billing-window', category: 'deployment_risk', severity: 'critical', status: 'open',
    title: 'Ledger schema migration is scheduled into the month-end close',
    summary: 'A billing-service release with a ledger-core schema migration is planned two days before month-end invoicing. The migration has no tested rollback.',
    impact: 'A failed migration would block invoicing for all carriers during the most sensitive window of the month.',
    detectedAt: hoursAgo(9), confidence: 0.88, ownerTeamId: 'team-payments',
    entityIds: ['svc-billing', 'svc-ledger', 'proj-ledger', 'p-daniel', 'adr-021'],
    evidence: [
      { kind: 'ticket', system: 'Jira', title: 'PAY-2204: Release window for migration 0147', excerpt: 'Target date falls two days before month-end close. Rollback marked "to be confirmed".', occurredAt: daysAgo(3) },
      { kind: 'pull_request', system: 'GitHub', title: 'kestrel/ledger-core #612: migration 0147', excerpt: 'Rewrites the balance tables. The rollback script is not part of the pull request.', occurredAt: daysAgo(4) },
      { kind: 'incident', system: 'Slack', title: '#inc-2107 retrospective', excerpt: 'The last ledger migration caused 40 minutes of failed writes.', occurredAt: daysAgo(118) },
    ],
    recommendations: [
      'Move the release until after month-end close.',
      'Add and rehearse a rollback for migration 0147 on a production snapshot.',
      'Have Henrik Lindqvist run the migration while still at the company.',
    ],
  },
  {
    id: 'ins-deploy-time', category: 'deployment_risk', severity: 'high', status: 'acknowledged',
    title: 'Deploy time has more than doubled in 26 weeks',
    summary: 'Median pipeline duration rose from about 11 to 27 minutes. Most of the increase is the integration test stage that followed ADR-035.',
    impact: 'Deploy frequency fell about 30% over the same period, and slower rollbacks lengthen incidents.',
    detectedAt: daysAgo(4), confidence: 0.93, ownerTeamId: 'team-platform',
    entityIds: ['repo-ci-templates', 'adr-035', 'adr-024', 'proj-ci', 'p-ravi'],
    evidence: [
      { kind: 'metric', system: 'CI/CD', title: 'Pipeline duration by stage', excerpt: 'Integration tests account for about 70% of the increase since 26 weeks ago.' },
      { kind: 'adr', system: 'GitLab', title: 'ADR-035: Ephemeral per-PR environments', excerpt: 'Each pipeline now provisions an isolated namespace before running tests.', occurredAt: daysAgo(77) },
      { kind: 'adr', system: 'GitLab', title: 'ADR-024: Shared CI templates', excerpt: 'Per-repository build caches were dropped when templates were centralized.', occurredAt: daysAgo(118) },
    ],
    recommendations: [
      'Shard integration tests and run them only for changed services.',
      'Restore image layer caching in the shared templates.',
    ],
  },
  {
    id: 'ins-route-cfr', category: 'deployment_risk', severity: 'high', status: 'open',
    title: 'route-engine change failure rate is three times the org median',
    summary: '18% of route-engine deploys in the last 30 days led to a rollback or incident, against an org median of 6%.',
    impact: 'route-engine is a Tier 0 service, and the v3 cutover adds a large change on top of this.',
    detectedAt: daysAgo(1), confidence: 0.86, ownerTeamId: 'team-routing',
    entityIds: ['svc-route-engine', 'proj-route-v3', 'p-priya'],
    evidence: [
      { kind: 'metric', system: 'CI/CD', title: 'Change failure rate, last 30 days', excerpt: 'route-engine 18%, org median 6%.' },
      { kind: 'incident', system: 'Slack', title: '#inc-2291', excerpt: 'Sev-2 timeouts during the morning planning peak.', occurredAt: minutesAgo(26) },
    ],
    recommendations: [
      'Require a canary stage for solver changes before the v3 cutover.',
      'Replay recorded morning-peak traffic in load tests before each release.',
    ],
  },

  /* ------------------------------------------------------- Dependency issues */
  {
    id: 'ins-log4j', category: 'dependency_issue', severity: 'critical', status: 'open',
    title: 'edi-translator still ships a vulnerable log4j-core',
    summary: 'The service builds with log4j-core 2.14.1, affected by CVE-2021-44228, and has not been deployed in 61 days.',
    impact: 'edi-translator parses documents from external carriers, so untrusted input reaches this code path.',
    detectedAt: hoursAgo(16), confidence: 0.98, ownerTeamId: 'team-carrier',
    entityIds: ['svc-edi', 'repo-edi', 'p-marek', 'p-jonas'],
    evidence: [
      { kind: 'commit', system: 'GitLab', title: 'pom.xml in kestrel/edi-translator', excerpt: 'log4j-core 2.14.1, last changed 3 years ago.' },
      { kind: 'adr', system: 'Notion', title: 'ADR-027: Retire EDI', excerpt: 'Blocked upgrades are cited as a reason to retire the service, but the ADR is still proposed.', occurredAt: daysAgo(40) },
    ],
    recommendations: [
      'Upgrade log4j-core now rather than waiting for retirement.',
      'Have Jonas Weber review the externally reachable document parsers.',
    ],
  },
  {
    id: 'ins-cycle', category: 'dependency_issue', severity: 'high', status: 'open',
    title: 'Circular dependency between tracking-service and carrier-gateway',
    summary: 'Each service calls the other synchronously. A slowdown in either one can propagate back into itself.',
    impact: 'Both services feed eta-predictor and driver-bff, so a feedback loop would reach driver-facing features.',
    detectedAt: daysAgo(6), confidence: 0.97, ownerTeamId: 'team-carrier',
    entityIds: ['svc-tracking', 'svc-carrier-gateway', 'svc-eta', 'svc-driver-bff'],
    evidence: [
      { kind: 'graph', system: 'Knowledge graph', title: 'Dependency cycle', excerpt: 'tracking-service depends on carrier-gateway, and carrier-gateway depends on tracking-service.' },
      { kind: 'incident', system: 'Slack', title: '#inc-2230', excerpt: 'Retry storm between the two services lasted 22 minutes.', occurredAt: daysAgo(33) },
    ],
    recommendations: [
      'Replace the carrier-gateway call to tracking-service with a Kafka subscription.',
      'Add circuit breakers on both sides until the cycle is removed.',
    ],
  },
  {
    id: 'ins-v1-endpoint', category: 'dependency_issue', severity: 'high', status: 'open',
    title: 'driver-bff depends on a route-engine endpoint removed in v3',
    summary: 'driver-bff still calls /v1/plan. Route Engine v3 removes it, and Driver App 5.0 has not planned a migration.',
    impact: 'Without a fix, the v3 cutover breaks route planning in the driver app.',
    detectedAt: daysAgo(1), confidence: 0.9, ownerTeamId: 'team-driver',
    entityIds: ['svc-driver-bff', 'svc-route-engine', 'proj-route-v3', 'proj-driver-5', 'p-nora'],
    evidence: [
      { kind: 'commit', system: 'GitHub', title: 'kestrel/driver-bff: src/routing/client.ts', excerpt: 'Calls POST /v1/plan on route-engine.' },
      { kind: 'pull_request', system: 'GitHub', title: 'kestrel/route-engine #4127', excerpt: 'Removes the v1 handlers behind the v3 flag.', occurredAt: hoursAgo(1) },
      { kind: 'document', system: 'Microsoft Teams', title: 'Route Engine v3 sync notes', excerpt: 'Action item: Driver Experience to confirm the plan for the v1 endpoint removal.', occurredAt: hoursAgo(3) },
    ],
    recommendations: [
      'Add /v2/plan support in driver-bff before the v3 cutover.',
      'Keep a v1 compatibility shim in route-engine until the driver app has rolled out.',
    ],
  },

  /* ---------------------------------------------------------- Duplicate work */
  {
    id: 'ins-rate-limit', category: 'duplicate_work', severity: 'high', status: 'open',
    title: 'Two teams are building the same Redis rate limiter',
    summary: 'Gateway Rate Limiting and Carrier Throttling are both implementing a Redis token bucket. ADR-031 already defines this as a shared gateway capability.',
    impact: 'About 11 engineer-weeks of overlapping work so far, and two limiters to operate afterwards.',
    detectedAt: daysAgo(4), confidence: 0.84, ownerTeamId: 'team-platform',
    entityIds: ['proj-gw-rate', 'proj-carrier-throttle', 'adr-031', 'p-elena', 'p-grace'],
    evidence: [
      { kind: 'pull_request', system: 'GitHub', title: 'kestrel/carrier-gateway #902', excerpt: 'Adds a Redis token bucket with per-key refill.', occurredAt: hoursAgo(27) },
      { kind: 'pull_request', system: 'GitHub', title: 'kestrel/api-gateway #2231', excerpt: 'Adds a Redis token bucket with per-route refill.', occurredAt: daysAgo(9) },
      { kind: 'adr', system: 'Notion', title: 'ADR-031', excerpt: 'Rate limiting becomes a shared gateway capability, available to all routes.', occurredAt: daysAgo(75) },
    ],
    recommendations: [
      'Connect Elena Petrova and Grace Adeyemi this week and pick one implementation.',
      'Publish the limiter as a shared library, with per-carrier limits as a configuration.',
    ],
  },
  {
    id: 'ins-address', category: 'duplicate_work', severity: 'medium', status: 'open',
    title: 'Address normalization is implemented twice',
    summary: 'geo-index and tracking-service each added their own address normalization within the same month.',
    impact: 'Different results for the same address can produce routing and ETA mismatches.',
    detectedAt: daysAgo(8), confidence: 0.76, ownerTeamId: 'team-routing',
    entityIds: ['svc-geo-index', 'svc-tracking', 'p-carlos', 'p-tariq'],
    evidence: [
      { kind: 'pull_request', system: 'GitHub', title: 'kestrel/geo-index #340', excerpt: 'Adds normalize_address with country-specific rules.', occurredAt: daysAgo(21) },
      { kind: 'pull_request', system: 'GitHub', title: 'kestrel/tracking-service #588', excerpt: 'Adds an address cleaner for carrier stop data.', occurredAt: daysAgo(14) },
    ],
    recommendations: [
      'Make geo-index the single normalization API.',
      'Migrate tracking-service once the country rules match.',
    ],
  },

  /* -------------------------------------------------------- Outdated documents */
  {
    id: 'ins-route-runbook', category: 'outdated_docs', severity: 'high', status: 'open',
    title: 'route-engine runbook is 214 days behind the code',
    summary: 'The runbook has not changed in 214 days, while the service has shipped about 68 deploys. It still describes the JVM solver.',
    impact: 'On-call engineers responding to route-engine incidents are following steps for a solver that no longer exists.',
    detectedAt: daysAgo(3), confidence: 0.92, ownerTeamId: 'team-routing',
    entityIds: ['svc-route-engine', 'p-priya', 'adr-018'],
    evidence: [
      { kind: 'document', system: 'Notion', title: 'route-engine runbook', excerpt: 'Section 3: "Restart the JVM solver and increase the heap".', occurredAt: daysAgo(214) },
      { kind: 'adr', system: 'GitHub', title: 'ADR-018', excerpt: 'The solver core moved to Rust.', occurredAt: daysAgo(340) },
    ],
    recommendations: ['Rewrite the runbook using the #inc-2291 timeline as a starting point.'],
  },
  {
    id: 'ins-ledger-doc', category: 'outdated_docs', severity: 'medium', status: 'open',
    title: 'ledger-core on-call guide still refers to RabbitMQ',
    summary: 'The guide describes draining RabbitMQ queues, which ADR-012 replaced with Kafka.',
    impact: 'The next on-call engineers will rely on this guide more heavily after the current owner leaves.',
    detectedAt: daysAgo(5), confidence: 0.89, ownerTeamId: 'team-payments',
    entityIds: ['svc-ledger', 'adr-012', 'p-henrik'],
    evidence: [
      { kind: 'document', system: 'Notion', title: 'ledger-core on-call guide', excerpt: 'Step 4: "Drain the billing.events queue in RabbitMQ".', occurredAt: daysAgo(96) },
      { kind: 'adr', system: 'Notion', title: 'ADR-012', excerpt: 'RabbitMQ was decommissioned over two quarters.', occurredAt: daysAgo(430) },
    ],
    recommendations: ['Update the guide as part of the ledger handover.'],
  },
  {
    id: 'ins-event-contract', category: 'outdated_docs', severity: 'low', status: 'open',
    title: 'Published shipment event contract does not match production',
    summary: 'The v1 data contract omits three fields that consumers already use. A v2 draft exists but is not published.',
    impact: 'New consumers may build against an inaccurate schema.',
    detectedAt: daysAgo(6), confidence: 0.81, ownerTeamId: 'team-data',
    entityIds: ['svc-event-bus', 'svc-tracking', 'p-tomasz'],
    evidence: [
      { kind: 'document', system: 'Notion', title: 'Shipment event data contract', excerpt: 'v1 lists 14 fields. The production schema has 17.', occurredAt: daysAgo(6) },
    ],
    recommendations: ['Publish the v2 contract and generate it from the schema registry.'],
  },

  /* ---------------------------------------------------------- Technical debt */
  {
    id: 'ins-edi-debt', category: 'tech_debt', severity: 'high', status: 'open',
    title: 'edi-translator has 18% test coverage on 88 kloc',
    summary: 'The service runs on JDK 8 and has the lowest coverage in the organization, so even a dependency upgrade is risky.',
    impact: 'Coverage this low makes the security fix slower and riskier to ship.',
    detectedAt: daysAgo(10), confidence: 0.95, ownerTeamId: 'team-carrier',
    entityIds: ['repo-edi', 'svc-edi', 'proj-edi-retire'],
    evidence: [
      { kind: 'metric', system: 'GitLab', title: 'Coverage report', excerpt: '18% line coverage. The org median is 72%.' },
      { kind: 'ticket', system: 'Jira', title: 'CAR-1320: JDK upgrade', excerpt: 'Deferred twice pending EDI retirement.', occurredAt: daysAgo(60) },
    ],
    recommendations: [
      'Add characterization tests around the parsers before any upgrade.',
      'Make a decision on ADR-027 so that the investment level is clear.',
    ],
  },
  {
    id: 'ins-ci-monolith', category: 'tech_debt', severity: 'medium', status: 'open',
    title: 'Shared CI templates run every stage for every change',
    summary: 'All 19 repositories inherit one pipeline with no path filtering, so documentation changes also provision full integration environments.',
    impact: 'Wasted runner capacity contributes to queueing across all teams.',
    detectedAt: daysAgo(7), confidence: 0.87, ownerTeamId: 'team-platform',
    entityIds: ['repo-ci-templates', 'adr-024', 'p-ravi', 'proj-ci'],
    evidence: [
      { kind: 'metric', system: 'CI/CD', title: 'Pipeline runs by change type', excerpt: '23% of full pipeline runs in the last 30 days only changed documentation or comments.' },
      { kind: 'adr', system: 'GitLab', title: 'ADR-024', excerpt: 'All repositories inherit shared CI templates.', occurredAt: daysAgo(118) },
    ],
    recommendations: ['Add path filters to the shared templates.', 'Measure the runner time this saves as part of CI Modernization.'],
  },
  {
    id: 'ins-invoice-module', category: 'tech_debt', severity: 'medium', status: 'open',
    title: 'Invoice module is absorbing most billing-service changes',
    summary: '41% of billing-service pull requests touch the same module, and review times there are twice the repository average.',
    impact: 'Slower delivery on the highest-change area of a Tier 0 service.',
    detectedAt: daysAgo(11), confidence: 0.78, ownerTeamId: 'team-payments',
    entityIds: ['repo-billing', 'svc-billing', 'p-fatima'],
    evidence: [
      { kind: 'metric', system: 'GitHub', title: 'Change hotspots, last 90 days', excerpt: 'invoice/InvoiceEngine.kt appears in 41% of merged pull requests.' },
      { kind: 'pull_request', system: 'GitHub', title: 'kestrel/billing-service #1533', excerpt: 'First of four refactors to split invoice rules.', occurredAt: daysAgo(3) },
    ],
    recommendations: ['Continue the planned refactor series, and add review owners by rule type.'],
  },
  {
    id: 'ins-flaky', category: 'tech_debt', severity: 'low', status: 'resolved',
    title: 'Flaky checkout tests in driver-app were blocking merges',
    summary: 'Twelve flaky tests caused a quarter of pipeline retries. They have since been fixed.',
    impact: 'Resolved. Retries fell from 24% to 6%.',
    detectedAt: daysAgo(26), confidence: 0.9, ownerTeamId: 'team-driver',
    entityIds: ['repo-driver-app', 'p-sam'],
    evidence: [
      { kind: 'metric', system: 'CI/CD', title: 'Pipeline retry rate', excerpt: '24% four weeks ago, 6% this week.' },
    ],
    recommendations: ['Keep the flaky test quarantine job enabled.'],
  },
];
