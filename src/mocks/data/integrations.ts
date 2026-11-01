import type { Integration } from '@/api/types';

/**
 * Catalog only. Every integration starts as not_connected because no backend exists
 * in demo mode. The scopes describe what a real connection would request.
 */
export const integrationCatalog: Integration[] = [
  {
    id: 'github', name: 'GitHub', category: 'Source control',
    description: 'Repositories, pull requests, reviews and code ownership.',
    authMethod: 'GitHub App installation',
    ingests: ['Pull requests', 'Commits', 'Code owners', 'Actions runs'],
    scopes: ['contents: read', 'pull_requests: read', 'metadata: read', 'actions: read'],
    status: 'not_connected',
  },
  {
    id: 'gitlab', name: 'GitLab', category: 'Source control',
    description: 'Projects, merge requests and CI/CD pipelines.',
    authMethod: 'OAuth 2.0',
    ingests: ['Merge requests', 'Commits', 'Pipelines'],
    scopes: ['read_api', 'read_repository'],
    status: 'not_connected',
  },
  {
    id: 'jira', name: 'Jira', category: 'Project tracking',
    description: 'Issues, epics and sprint history linked to code and teams.',
    authMethod: 'OAuth 2.0 (3LO)',
    ingests: ['Issues', 'Epics', 'Sprints', 'Assignees'],
    scopes: ['read:jira-work', 'read:jira-user'],
    status: 'not_connected',
  },
  {
    id: 'notion', name: 'Notion', category: 'Documentation',
    description: 'Design documents, decision records and runbooks.',
    authMethod: 'OAuth 2.0',
    ingests: ['Pages', 'Databases', 'Edit history'],
    scopes: ['Read content', 'Read user information'],
    status: 'not_connected',
  },
  {
    id: 'slack', name: 'Slack', category: 'Communication',
    description: 'Decisions and incident timelines from channels you choose.',
    authMethod: 'OAuth 2.0',
    ingests: ['Public channel messages', 'Threads', 'Incident channels'],
    scopes: ['channels:history', 'channels:read', 'users:read'],
    status: 'not_connected',
  },
  {
    id: 'google-drive', name: 'Google Drive', category: 'Documentation',
    description: 'Design documents and meeting notes from selected drives.',
    authMethod: 'OAuth 2.0',
    ingests: ['Docs', 'Meeting notes', 'Sharing metadata'],
    scopes: ['drive.readonly', 'drive.metadata.readonly'],
    status: 'not_connected',
  },
  {
    id: 'microsoft-teams', name: 'Microsoft Teams', category: 'Communication',
    description: 'Channel conversations and meeting outcomes through Microsoft Graph.',
    authMethod: 'Microsoft Entra ID app',
    ingests: ['Channel messages', 'Meeting transcripts', 'Team membership'],
    scopes: ['ChannelMessage.Read.All', 'Team.ReadBasic.All', 'User.Read.All'],
    status: 'not_connected',
  },
];
