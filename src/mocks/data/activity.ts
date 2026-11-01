import type { ActivityEvent } from '@/api/types';
import { daysAgo, hoursAgo, minutesAgo } from './time';

export const activity: ActivityEvent[] = [
  {
    id: 'evt-1', type: 'incident', title: 'route-engine timeouts during the morning planning peak',
    detail: 'Sev-2 declared in #inc-2291. p95 reached 2.4 s for 38 minutes, then recovered after scaling solver workers.',
    source: 'Slack', actorId: 'p-priya', entityIds: ['svc-route-engine', 'svc-driver-bff'], occurredAt: minutesAgo(26),
    extractedBy: 'Incident agent', graphUpdates: 4,
  },
  {
    id: 'evt-2', type: 'code_change', title: 'Pull request #4127 opened on kestrel/route-engine',
    detail: 'Introduces the new constraint solver behind a feature flag. Touches 212 files.',
    source: 'GitHub', actorId: 'p-liam', entityIds: ['repo-route-engine', 'proj-route-v3'], occurredAt: minutesAgo(58),
    extractedBy: 'Code agent', graphUpdates: 3,
  },
  {
    id: 'evt-3', type: 'meeting', title: 'Route Engine v3 sync: cutover moved two weeks',
    detail: 'Action item: Driver Experience to confirm the plan for the v1 endpoint removal.',
    source: 'Microsoft Teams', actorId: 'p-priya', entityIds: ['proj-route-v3', 'team-driver'], occurredAt: hoursAgo(3),
    extractedBy: 'Meeting agent', graphUpdates: 2,
  },
  {
    id: 'evt-4', type: 'ownership_change', title: 'Fatima Al-Sayed added as a ledger-core maintainer',
    detail: 'CODEOWNERS updated as part of the handover from Henrik Lindqvist.',
    source: 'GitHub', actorId: 'p-daniel', entityIds: ['repo-ledger', 'p-fatima', 'p-henrik'], occurredAt: hoursAgo(5),
    extractedBy: 'Ownership agent', graphUpdates: 2,
  },
  {
    id: 'evt-5', type: 'documentation', title: 'Driver API reference updated for GraphQL schema v12',
    detail: 'Linked to the driver-bff release from this morning.',
    source: 'Notion', actorId: 'p-nora', entityIds: ['svc-driver-bff'], occurredAt: hoursAgo(9),
    extractedBy: 'Docs agent', graphUpdates: 1,
  },
  {
    id: 'evt-6', type: 'code_change', title: 'Merge request !388 in kestrel/ci-templates raises runner memory',
    detail: 'Integration test stage now requests 8 GB per job, up from 4 GB.',
    source: 'GitLab', actorId: 'p-ravi', entityIds: ['repo-ci-templates', 'proj-ci'], occurredAt: hoursAgo(14),
    extractedBy: 'Code agent', graphUpdates: 2,
  },
  {
    id: 'evt-7', type: 'decision', title: 'ADR-027 moved to review',
    detail: 'Comment thread open on carrier migration order. Three carriers are unresolved.',
    source: 'Notion', actorId: 'p-sofia', entityIds: ['adr-027', 'proj-edi-retire'], occurredAt: hoursAgo(20),
    extractedBy: 'Decision agent', graphUpdates: 1,
  },
  {
    id: 'evt-8', type: 'code_change', title: 'Pull request #902 in kestrel/carrier-gateway adds a Redis token bucket',
    detail: 'Similar in design to the gateway limiter described in ADR-031.',
    source: 'GitHub', actorId: 'p-grace', entityIds: ['repo-carrier-gateway', 'proj-carrier-throttle'], occurredAt: hoursAgo(27),
    extractedBy: 'Code agent', graphUpdates: 3,
  },
  {
    id: 'evt-9', type: 'meeting', title: 'Payments planning: ledger handover schedule agreed',
    detail: 'Three walkthrough sessions planned. Reconciliation session not yet scheduled.',
    source: 'Google Drive', actorId: 'p-daniel', entityIds: ['team-payments', 'svc-ledger'], occurredAt: hoursAgo(31),
    extractedBy: 'Meeting agent', graphUpdates: 2,
  },
  {
    id: 'evt-10', type: 'incident', title: 'Late webhook deliveries from payments-gateway',
    detail: 'Sev-3. Retries backed up for 12 minutes after a provider slowdown.',
    source: 'Slack', actorId: 'p-noah', entityIds: ['svc-payments-gateway'], occurredAt: hoursAgo(40),
    extractedBy: 'Incident agent', graphUpdates: 2,
  },
  {
    id: 'evt-11', type: 'documentation', title: 'Feature store onboarding guide rewritten for Feast',
    detail: 'Replaces the Postgres-based instructions from ADR-029.',
    source: 'Notion', actorId: 'p-oliver', entityIds: ['svc-feature-store', 'adr-033'], occurredAt: daysAgo(2),
    extractedBy: 'Docs agent', graphUpdates: 2,
  },
  {
    id: 'evt-12', type: 'ownership_change', title: 'On-call rotation for tracking-service expanded',
    detail: 'Grace Adeyemi joins Tariq Hassan on the rotation.',
    source: 'Jira', actorId: 'p-sofia', entityIds: ['svc-tracking', 'p-grace', 'p-tariq'], occurredAt: daysAgo(3),
    extractedBy: 'Ownership agent', graphUpdates: 1,
  },
  {
    id: 'evt-13', type: 'code_change', title: 'Pull request #1533 in kestrel/billing-service splits invoice rules',
    detail: 'First of four refactors to reduce the size of the invoice module.',
    source: 'GitHub', actorId: 'p-fatima', entityIds: ['repo-billing', 'svc-billing'], occurredAt: daysAgo(3),
    extractedBy: 'Code agent', graphUpdates: 2,
  },
  {
    id: 'evt-14', type: 'decision', title: 'ADR-031 linked to two open projects',
    detail: 'OrgMind connected Gateway Rate Limiting and Carrier Throttling to the same decision.',
    source: 'Notion', actorId: 'p-elena', entityIds: ['adr-031', 'proj-gw-rate', 'proj-carrier-throttle'], occurredAt: daysAgo(4),
    extractedBy: 'Decision agent', graphUpdates: 2,
  },
  {
    id: 'evt-15', type: 'meeting', title: 'CI Modernization kickoff notes published',
    detail: 'Test sharding pilot chosen. Build cache restoration is the second workstream.',
    source: 'Google Drive', actorId: 'p-ravi', entityIds: ['proj-ci'], occurredAt: daysAgo(5),
    extractedBy: 'Meeting agent', graphUpdates: 1,
  },
  {
    id: 'evt-16', type: 'documentation', title: 'Shipment event data contract v2 drafted',
    detail: 'The published v1 page no longer matches the schema in production.',
    source: 'Notion', actorId: 'p-tomasz', entityIds: ['svc-event-bus', 'svc-tracking'], occurredAt: daysAgo(6),
    extractedBy: 'Docs agent', graphUpdates: 1,
  },
];
