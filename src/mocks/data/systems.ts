import type { Repository, Service } from '@/api/types';
import { daysAgo, hoursAgo } from './time';

const service = (s: Omit<Service, 'lastDeployAt' | 'docsUpdatedAt'> & { deployedHoursAgo: number; docsDaysAgo: number }): Service => {
  const { deployedHoursAgo, docsDaysAgo, ...rest } = s;
  return { ...rest, lastDeployAt: hoursAgo(deployedHoursAgo), docsUpdatedAt: daysAgo(docsDaysAgo) };
};

export const services: Service[] = [
  service({
    id: 'svc-api-gateway', name: 'api-gateway', description: 'Public entry point: routing, authentication and rate limits.',
    teamId: 'team-platform', repositoryId: 'repo-api-gateway', tier: 0, runtime: 'Go', status: 'healthy', onCallId: 'p-elena',
    dependsOn: ['svc-identity', 'svc-route-engine', 'svc-billing', 'svc-tracking'],
    deploysPerWeek: 6.5, p95Ms: 42, errorRatePct: 0.04, deployedHoursAgo: 7, docsDaysAgo: 18,
  }),
  service({
    id: 'svc-identity', name: 'identity-service', description: 'Authentication, sessions and service credentials.',
    teamId: 'team-platform', repositoryId: 'repo-identity', tier: 0, runtime: 'Go', status: 'healthy', onCallId: 'p-jonas',
    dependsOn: [], deploysPerWeek: 2.5, p95Ms: 18, errorRatePct: 0.01, deployedHoursAgo: 52, docsDaysAgo: 24,
  }),
  service({
    id: 'svc-route-engine', name: 'route-engine', description: 'Solves multi-stop routing plans under carrier and time-window constraints.',
    teamId: 'team-routing', repositoryId: 'repo-route-engine', tier: 0, runtime: 'Rust', status: 'degraded', onCallId: 'p-priya',
    dependsOn: ['svc-geo-index', 'svc-feature-store', 'svc-event-bus'],
    deploysPerWeek: 2.2, p95Ms: 840, errorRatePct: 0.62, deployedHoursAgo: 31, docsDaysAgo: 214,
  }),
  service({
    id: 'svc-eta', name: 'eta-predictor', description: 'Predicts stop-level arrival times from live tracking and historical lanes.',
    teamId: 'team-routing', repositoryId: 'repo-eta', tier: 1, runtime: 'Python', status: 'healthy', onCallId: 'p-mei',
    dependsOn: ['svc-feature-store', 'svc-tracking'],
    deploysPerWeek: 3, p95Ms: 120, errorRatePct: 0.11, deployedHoursAgo: 20, docsDaysAgo: 41,
  }),
  service({
    id: 'svc-geo-index', name: 'geo-index', description: 'Spatial lookup and geocoding for stops, depots and lanes.',
    teamId: 'team-routing', repositoryId: 'repo-geo-index', tier: 1, runtime: 'Go', status: 'healthy', onCallId: 'p-carlos',
    dependsOn: [], deploysPerWeek: 1.5, p95Ms: 26, errorRatePct: 0.03, deployedHoursAgo: 96, docsDaysAgo: 60,
  }),
  service({
    id: 'svc-billing', name: 'billing-service', description: 'Generates invoices and applies carrier rate cards.',
    teamId: 'team-payments', repositoryId: 'repo-billing', tier: 0, runtime: 'Kotlin', status: 'at_risk', onCallId: 'p-fatima',
    dependsOn: ['svc-ledger', 'svc-payments-gateway', 'svc-event-bus', 'svc-identity'],
    deploysPerWeek: 3.5, p95Ms: 210, errorRatePct: 0.09, deployedHoursAgo: 28, docsDaysAgo: 73,
  }),
  service({
    id: 'svc-ledger', name: 'ledger-core', description: 'Double-entry ledger and the source of truth for all money movement.',
    teamId: 'team-payments', repositoryId: 'repo-ledger', tier: 0, runtime: 'Java', status: 'at_risk', onCallId: 'p-henrik',
    dependsOn: [], deploysPerWeek: 0.8, p95Ms: 34, errorRatePct: 0.01, deployedHoursAgo: 190, docsDaysAgo: 96,
  }),
  service({
    id: 'svc-payments-gateway', name: 'payments-gateway', description: 'Executes carrier payouts and processes provider webhooks.',
    teamId: 'team-payments', repositoryId: 'repo-payments-gateway', tier: 0, runtime: 'Go', status: 'healthy', onCallId: 'p-noah',
    dependsOn: ['svc-ledger'], deploysPerWeek: 2, p95Ms: 88, errorRatePct: 0.05, deployedHoursAgo: 66, docsDaysAgo: 33,
  }),
  service({
    id: 'svc-carrier-gateway', name: 'carrier-gateway', description: 'Connects carrier APIs and normalizes their requests and responses.',
    teamId: 'team-carrier', repositoryId: 'repo-carrier-gateway', tier: 1, runtime: 'TypeScript', status: 'healthy', onCallId: 'p-grace',
    dependsOn: ['svc-edi', 'svc-event-bus', 'svc-identity', 'svc-tracking'],
    deploysPerWeek: 4, p95Ms: 160, errorRatePct: 0.14, deployedHoursAgo: 15, docsDaysAgo: 29,
  }),
  service({
    id: 'svc-tracking', name: 'tracking-service', description: 'Maintains the current status and location of every shipment.',
    teamId: 'team-carrier', repositoryId: 'repo-tracking', tier: 1, runtime: 'Go', status: 'healthy', onCallId: 'p-tariq',
    dependsOn: ['svc-carrier-gateway', 'svc-event-bus'],
    deploysPerWeek: 3, p95Ms: 54, errorRatePct: 0.07, deployedHoursAgo: 44, docsDaysAgo: 38,
  }),
  service({
    id: 'svc-edi', name: 'edi-translator', description: 'Translates EDI X12 documents from older carrier systems.',
    teamId: 'team-carrier', repositoryId: 'repo-edi', tier: 2, runtime: 'Java', status: 'at_risk', onCallId: 'p-marek',
    dependsOn: [], deploysPerWeek: 0.1, p95Ms: 480, errorRatePct: 0.38, deployedHoursAgo: 1460, docsDaysAgo: 402,
  }),
  service({
    id: 'svc-event-bus', name: 'event-bus', description: 'Managed Kafka cluster carrying all domain events.',
    teamId: 'team-data', repositoryId: 'repo-event-platform', tier: 0, runtime: 'Kafka', status: 'healthy', onCallId: 'p-tomasz',
    dependsOn: [], deploysPerWeek: 0.5, p95Ms: 9, errorRatePct: 0, deployedHoursAgo: 310, docsDaysAgo: 54,
  }),
  service({
    id: 'svc-feature-store', name: 'feature-store', description: 'Serves online and offline features to routing and ETA models.',
    teamId: 'team-data', repositoryId: 'repo-feature-store', tier: 1, runtime: 'Python', status: 'healthy', onCallId: 'p-oliver',
    dependsOn: ['svc-event-bus'], deploysPerWeek: 2, p95Ms: 14, errorRatePct: 0.02, deployedHoursAgo: 58, docsDaysAgo: 22,
  }),
  service({
    id: 'svc-warehouse-etl', name: 'warehouse-etl', description: 'Loads domain events into the analytics warehouse.',
    teamId: 'team-data', repositoryId: 'repo-warehouse-etl', tier: 2, runtime: 'Python', status: 'healthy', onCallId: 'p-anika',
    dependsOn: ['svc-event-bus'], deploysPerWeek: 1.5, p95Ms: 1200, errorRatePct: 0.2, deployedHoursAgo: 74, docsDaysAgo: 88,
  }),
  service({
    id: 'svc-driver-bff', name: 'driver-bff', description: 'GraphQL backend for the driver app.',
    teamId: 'team-driver', repositoryId: 'repo-driver-bff', tier: 1, runtime: 'TypeScript', status: 'healthy', onCallId: 'p-nora',
    dependsOn: ['svc-route-engine', 'svc-tracking', 'svc-notifications', 'svc-identity'],
    deploysPerWeek: 5, p95Ms: 130, errorRatePct: 0.08, deployedHoursAgo: 11, docsDaysAgo: 15,
  }),
  service({
    id: 'svc-notifications', name: 'notification-service', description: 'Sends push, SMS and email messages to drivers and shippers.',
    teamId: 'team-driver', repositoryId: 'repo-notifications', tier: 2, runtime: 'TypeScript', status: 'healthy', onCallId: 'p-dev',
    dependsOn: ['svc-event-bus'], deploysPerWeek: 2.5, p95Ms: 70, errorRatePct: 0.12, deployedHoursAgo: 39, docsDaysAgo: 47,
  }),
];

const repo = (r: Omit<Repository, 'lastCommitAt'> & { committedHoursAgo: number }): Repository => {
  const { committedHoursAgo, ...rest } = r;
  return { ...rest, lastCommitAt: hoursAgo(committedHoursAgo) };
};

export const repositories: Repository[] = [
  repo({ id: 'repo-api-gateway', name: 'kestrel/api-gateway', provider: 'GitHub', language: 'Go', teamId: 'team-platform', maintainerIds: ['p-elena', 'p-maya', 'p-jonas'], topContributorId: 'p-elena', topContributorSharePct: 46, busFactor: 3, openPullRequests: 7, coveragePct: 78, sizeKloc: 42, committedHoursAgo: 5 }),
  repo({ id: 'repo-identity', name: 'kestrel/identity-service', provider: 'GitHub', language: 'Go', teamId: 'team-platform', maintainerIds: ['p-jonas', 'p-elena'], topContributorId: 'p-jonas', topContributorSharePct: 62, busFactor: 2, openPullRequests: 3, coveragePct: 84, sizeKloc: 28, committedHoursAgo: 48 }),
  repo({ id: 'repo-platform-infra', name: 'kestrel/platform-infra', provider: 'GitLab', language: 'HCL', teamId: 'team-platform', maintainerIds: ['p-maya', 'p-elena', 'p-ravi'], topContributorId: 'p-elena', topContributorSharePct: 41, busFactor: 3, openPullRequests: 5, coveragePct: null, sizeKloc: 31, committedHoursAgo: 9 }),
  repo({ id: 'repo-ci-templates', name: 'kestrel/ci-templates', provider: 'GitLab', language: 'YAML', teamId: 'team-platform', maintainerIds: ['p-ravi'], topContributorId: 'p-ravi', topContributorSharePct: 78, busFactor: 1, openPullRequests: 2, coveragePct: null, sizeKloc: 6, committedHoursAgo: 26 }),

  repo({ id: 'repo-route-engine', name: 'kestrel/route-engine', provider: 'GitHub', language: 'Rust', teamId: 'team-routing', maintainerIds: ['p-priya', 'p-liam'], topContributorId: 'p-priya', topContributorSharePct: 84, busFactor: 1, openPullRequests: 11, coveragePct: 71, sizeKloc: 96, committedHoursAgo: 3 }),
  repo({ id: 'repo-eta', name: 'kestrel/eta-predictor', provider: 'GitHub', language: 'Python', teamId: 'team-routing', maintainerIds: ['p-mei', 'p-carlos'], topContributorId: 'p-mei', topContributorSharePct: 71, busFactor: 2, openPullRequests: 5, coveragePct: 63, sizeKloc: 31, committedHoursAgo: 14 }),
  repo({ id: 'repo-geo-index', name: 'kestrel/geo-index', provider: 'GitHub', language: 'Go', teamId: 'team-routing', maintainerIds: ['p-carlos', 'p-liam'], topContributorId: 'p-carlos', topContributorSharePct: 58, busFactor: 2, openPullRequests: 2, coveragePct: 80, sizeKloc: 19, committedHoursAgo: 90 }),

  repo({ id: 'repo-billing', name: 'kestrel/billing-service', provider: 'GitHub', language: 'Kotlin', teamId: 'team-payments', maintainerIds: ['p-fatima', 'p-daniel', 'p-noah'], topContributorId: 'p-fatima', topContributorSharePct: 44, busFactor: 3, openPullRequests: 14, coveragePct: 66, sizeKloc: 138, committedHoursAgo: 2 }),
  repo({ id: 'repo-ledger', name: 'kestrel/ledger-core', provider: 'GitHub', language: 'Java', teamId: 'team-payments', maintainerIds: ['p-henrik', 'p-fatima'], topContributorId: 'p-henrik', topContributorSharePct: 91, busFactor: 1, openPullRequests: 4, coveragePct: 74, sizeKloc: 64, committedHoursAgo: 22 }),
  repo({ id: 'repo-payments-gateway', name: 'kestrel/payments-gateway', provider: 'GitHub', language: 'Go', teamId: 'team-payments', maintainerIds: ['p-noah', 'p-daniel'], topContributorId: 'p-noah', topContributorSharePct: 52, busFactor: 2, openPullRequests: 3, coveragePct: 82, sizeKloc: 24, committedHoursAgo: 40 }),

  repo({ id: 'repo-carrier-gateway', name: 'kestrel/carrier-gateway', provider: 'GitHub', language: 'TypeScript', teamId: 'team-carrier', maintainerIds: ['p-grace', 'p-sofia', 'p-tariq'], topContributorId: 'p-grace', topContributorSharePct: 49, busFactor: 3, openPullRequests: 9, coveragePct: 69, sizeKloc: 57, committedHoursAgo: 6 }),
  repo({ id: 'repo-tracking', name: 'kestrel/tracking-service', provider: 'GitHub', language: 'Go', teamId: 'team-carrier', maintainerIds: ['p-tariq', 'p-grace'], topContributorId: 'p-tariq', topContributorSharePct: 55, busFactor: 2, openPullRequests: 4, coveragePct: 73, sizeKloc: 33, committedHoursAgo: 19 }),
  repo({ id: 'repo-edi', name: 'kestrel/edi-translator', provider: 'GitLab', language: 'Java', teamId: 'team-carrier', maintainerIds: ['p-marek'], topContributorId: 'p-marek', topContributorSharePct: 96, busFactor: 1, openPullRequests: 1, coveragePct: 18, sizeKloc: 88, committedHoursAgo: 1460 }),

  repo({ id: 'repo-event-platform', name: 'kestrel/event-platform', provider: 'GitHub', language: 'Scala', teamId: 'team-data', maintainerIds: ['p-tomasz', 'p-lucia'], topContributorId: 'p-tomasz', topContributorSharePct: 60, busFactor: 2, openPullRequests: 3, coveragePct: 72, sizeKloc: 37, committedHoursAgo: 72 }),
  repo({ id: 'repo-feature-store', name: 'kestrel/feature-store', provider: 'GitHub', language: 'Python', teamId: 'team-data', maintainerIds: ['p-oliver', 'p-mei'], topContributorId: 'p-oliver', topContributorSharePct: 68, busFactor: 2, openPullRequests: 6, coveragePct: 76, sizeKloc: 26, committedHoursAgo: 12 }),
  repo({ id: 'repo-warehouse-etl', name: 'kestrel/warehouse-etl', provider: 'GitLab', language: 'Python', teamId: 'team-data', maintainerIds: ['p-anika', 'p-lucia'], topContributorId: 'p-anika', topContributorSharePct: 57, busFactor: 2, openPullRequests: 4, coveragePct: 58, sizeKloc: 45, committedHoursAgo: 30 }),

  repo({ id: 'repo-driver-app', name: 'kestrel/driver-app', provider: 'GitHub', language: 'TypeScript', teamId: 'team-driver', maintainerIds: ['p-sam', 'p-aisha', 'p-nora'], topContributorId: 'p-sam', topContributorSharePct: 54, busFactor: 3, openPullRequests: 12, coveragePct: 48, sizeKloc: 174, committedHoursAgo: 1 }),
  repo({ id: 'repo-driver-bff', name: 'kestrel/driver-bff', provider: 'GitHub', language: 'TypeScript', teamId: 'team-driver', maintainerIds: ['p-nora', 'p-sam'], topContributorId: 'p-nora', topContributorSharePct: 61, busFactor: 2, openPullRequests: 5, coveragePct: 74, sizeKloc: 39, committedHoursAgo: 10 }),
  repo({ id: 'repo-notifications', name: 'kestrel/notification-service', provider: 'GitHub', language: 'TypeScript', teamId: 'team-driver', maintainerIds: ['p-dev', 'p-nora'], topContributorId: 'p-dev', topContributorSharePct: 64, busFactor: 2, openPullRequests: 2, coveragePct: 70, sizeKloc: 18, committedHoursAgo: 36 }),
];
