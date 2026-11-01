import type { OrgDirectory } from '@/api/types';
import { people, teams } from './people';
import { repositories, services } from './systems';
import { decisions, projects } from './work';

export { activity } from './activity';
export { insights } from './insights';
export { integrationCatalog } from './integrations';
export { deployStages, engineeringSignals, graphGrowth } from './signals';
export { suggestedQuestions } from './suggestions';

export const directory: OrgDirectory = { people, teams, projects, services, repositories, decisions };

export const ORGANIZATION_NAME = 'Kestrel Freight';
