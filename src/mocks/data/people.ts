import type { Person, Team } from '@/api/types';
import { daysAgo, daysFromNow } from './time';

export const teams: Team[] = [
  {
    id: 'team-platform',
    name: 'Platform Infrastructure',
    mission: 'Runs Kubernetes, CI/CD, the API gateway and identity for every other team.',
    leadId: 'p-maya',
    channel: '#team-platform',
  },
  {
    id: 'team-routing',
    name: 'Routing & Optimization',
    mission: 'Plans multi-stop freight routes and predicts arrival times.',
    leadId: 'p-priya',
    channel: '#team-routing',
  },
  {
    id: 'team-payments',
    name: 'Payments & Billing',
    mission: 'Owns the ledger, invoicing and carrier payouts.',
    leadId: 'p-daniel',
    channel: '#team-payments',
  },
  {
    id: 'team-carrier',
    name: 'Carrier Network',
    mission: 'Connects carrier systems, normalizes tracking events and retires legacy EDI.',
    leadId: 'p-sofia',
    channel: '#team-carrier',
  },
  {
    id: 'team-data',
    name: 'Data Platform',
    mission: 'Operates the event bus, the feature store and warehouse pipelines.',
    leadId: 'p-tomasz',
    channel: '#team-data',
  },
  {
    id: 'team-driver',
    name: 'Driver Experience',
    mission: 'Builds the driver app and the backend services behind it.',
    leadId: 'p-aisha',
    channel: '#team-driver',
  },
];

const person = (
  id: string,
  name: string,
  role: string,
  teamId: string,
  location: string,
  expertise: string[],
  tenureDays: number,
  extra: Partial<Person> = {},
): Person => ({
  id,
  name,
  role,
  teamId,
  location,
  expertise,
  email: `${id.replace('p-', '')}@kestrelfreight.example`,
  startedAt: daysAgo(tenureDays),
  status: 'active',
  ...extra,
});

export const people: Person[] = [
  person('p-maya', 'Maya Okafor', 'Engineering Manager', 'team-platform', 'London', ['Kubernetes', 'Terraform', 'Incident response'], 1890),
  person('p-ravi', 'Ravi Shankar', 'Staff Platform Engineer', 'team-platform', 'Bengaluru', ['CI/CD', 'Build systems', 'Docker', 'GitHub Actions'], 1420),
  person('p-elena', 'Elena Petrova', 'Senior Site Reliability Engineer', 'team-platform', 'Berlin', ['Observability', 'Postgres', 'Rate limiting', 'Go'], 1105),
  person('p-jonas', 'Jonas Weber', 'Security Engineer', 'team-platform', 'Berlin', ['OAuth', 'Identity', 'SOC 2'], 760),

  person('p-priya', 'Priya Raman', 'Principal Engineer', 'team-routing', 'Bengaluru', ['Rust', 'Vehicle routing', 'Graph algorithms', 'Constraint solving'], 2240),
  person('p-liam', "Liam O'Connell", 'Senior Software Engineer', 'team-routing', 'Dublin', ['Rust', 'Geospatial', 'PostGIS'], 610),
  person('p-mei', 'Mei Tanaka', 'Machine Learning Engineer', 'team-routing', 'Singapore', ['ETA models', 'PyTorch', 'Feature engineering'], 880),
  person('p-carlos', 'Carlos Mendes', 'Software Engineer', 'team-routing', 'Lisbon', ['Go', 'Geocoding', 'Spatial indexes'], 420),

  person('p-daniel', 'Daniel Cho', 'Engineering Manager', 'team-payments', 'Toronto', ['Payments', 'Kotlin', 'PCI compliance'], 1530),
  person('p-henrik', 'Henrik Lindqvist', 'Staff Software Engineer', 'team-payments', 'Stockholm', ['Double-entry accounting', 'Java', 'Ledger design', 'Reconciliation'], 2610, {
    status: 'departing',
    lastDayAt: daysFromNow(14),
  }),
  person('p-fatima', 'Fatima Al-Sayed', 'Senior Software Engineer', 'team-payments', 'Dubai', ['Kotlin', 'Invoicing', 'Reconciliation'], 940),
  person('p-noah', 'Noah Greenberg', 'Software Engineer', 'team-payments', 'New York', ['Go', 'Webhooks', 'Payouts'], 390),

  person('p-sofia', 'Sofia Marin', 'Engineering Manager', 'team-carrier', 'Madrid', ['Carrier integrations', 'API design'], 1260),
  person('p-marek', 'Marek Novak', 'Senior Software Engineer', 'team-carrier', 'Prague', ['EDI X12', 'Java', 'Legacy systems'], 3120),
  person('p-grace', 'Grace Adeyemi', 'Senior Software Engineer', 'team-carrier', 'Lagos', ['TypeScript', 'Redis', 'Rate limiting'], 700),
  person('p-tariq', 'Tariq Hassan', 'Software Engineer', 'team-carrier', 'Amman', ['Go', 'Event streaming', 'Address normalization'], 455),

  person('p-tomasz', 'Tomasz Wieczorek', 'Data Platform Lead', 'team-data', 'Warsaw', ['Kafka', 'Stream processing', 'Data contracts'], 1680),
  person('p-anika', 'Anika Bose', 'Senior Data Engineer', 'team-data', 'Kolkata', ['Spark', 'dbt', 'Airflow'], 1010),
  person('p-oliver', 'Oliver Brandt', 'ML Platform Engineer', 'team-data', 'Hamburg', ['Feature stores', 'Feast', 'Redis'], 830),
  person('p-lucia', 'Lucia Ferrari', 'Data Engineer', 'team-data', 'Milan', ['Flink', 'Python', 'Schema registry'], 365),

  person('p-aisha', 'Aisha Bello', 'Engineering Manager', 'team-driver', 'Nairobi', ['React Native', 'Mobile delivery', 'Product strategy'], 1340),
  person('p-sam', 'Sam Whitfield', 'Senior Mobile Engineer', 'team-driver', 'Manchester', ['React Native', 'Offline sync', 'Release management'], 980),
  person('p-nora', 'Nora Lindgren', 'Software Engineer', 'team-driver', 'Oslo', ['TypeScript', 'GraphQL', 'Backend for frontend'], 640),
  person('p-dev', 'Dev Malhotra', 'Software Engineer', 'team-driver', 'Pune', ['Push notifications', 'TypeScript', 'Kafka consumers'], 510),
];
