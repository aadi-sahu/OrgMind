import {
  Copy,
  FileClock,
  FileText,
  GitCommitHorizontal,
  GitPullRequest,
  LineChart,
  MessageSquare,
  Network,
  Rocket,
  Scale,
  Share2,
  Siren,
  Ticket,
  UserRoundX,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { EvidenceKind, InsightCategory } from '@/api';

export const CATEGORY_META: Record<InsightCategory, { label: string; icon: LucideIcon; description: string }> = {
  tech_debt: { label: 'Technical debt', icon: Wrench, description: 'Code and infrastructure that slow teams down' },
  outdated_docs: { label: 'Outdated documentation', icon: FileClock, description: 'Documents that no longer match the code' },
  knowledge_silo: { label: 'Knowledge silos', icon: UserRoundX, description: 'Critical knowledge held by too few people' },
  duplicate_work: { label: 'Duplicate work', icon: Copy, description: 'Teams solving the same problem separately' },
  deployment_risk: { label: 'Deployment risks', icon: Rocket, description: 'Releases likely to cause problems' },
  dependency_issue: { label: 'Dependency issues', icon: Network, description: 'Risky or fragile dependencies' },
};

export const CATEGORIES = Object.keys(CATEGORY_META) as InsightCategory[];

export const EVIDENCE_META: Record<EvidenceKind, { label: string; icon: LucideIcon }> = {
  metric: { label: 'Metric', icon: LineChart },
  pull_request: { label: 'Pull request', icon: GitPullRequest },
  commit: { label: 'Code', icon: GitCommitHorizontal },
  adr: { label: 'Decision record', icon: Scale },
  incident: { label: 'Incident', icon: Siren },
  document: { label: 'Document', icon: FileText },
  ticket: { label: 'Ticket', icon: Ticket },
  message: { label: 'Message', icon: MessageSquare },
  graph: { label: 'Knowledge graph', icon: Share2 },
};
