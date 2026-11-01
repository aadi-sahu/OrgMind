import type {
  Decision,
  EntityType,
  OrgDirectory,
  Person,
  Project,
  Repository,
  Service,
  Team,
} from '@/api';

export type EntityRecord =
  | { type: 'person'; record: Person }
  | { type: 'team'; record: Team }
  | { type: 'project'; record: Project }
  | { type: 'service'; record: Service }
  | { type: 'repository'; record: Repository }
  | { type: 'decision'; record: Decision };

export function findEntity(directory: OrgDirectory, id: string): EntityRecord | undefined {
  const person = directory.people.find((p) => p.id === id);
  if (person) return { type: 'person', record: person };
  const team = directory.teams.find((t) => t.id === id);
  if (team) return { type: 'team', record: team };
  const project = directory.projects.find((p) => p.id === id);
  if (project) return { type: 'project', record: project };
  const service = directory.services.find((s) => s.id === id);
  if (service) return { type: 'service', record: service };
  const repository = directory.repositories.find((r) => r.id === id);
  if (repository) return { type: 'repository', record: repository };
  const decision = directory.decisions.find((d) => d.id === id);
  if (decision) return { type: 'decision', record: decision };
  return undefined;
}

/** A question worth asking the assistant about this entity. */
export function suggestedQuestion(type: EntityType, name: string): string {
  switch (type) {
    case 'person':
      return `What happens if ${name} leaves?`;
    case 'team':
      return `How do I get started on ${name}?`;
    case 'project':
      return `Is ${name} on track?`;
    case 'service':
      return `What breaks if ${name} goes down?`;
    case 'repository':
      return `Who owns ${name}?`;
    case 'decision':
      return `Why did we decide ${name}?`;
  }
}
