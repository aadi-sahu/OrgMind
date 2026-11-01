import {
  CheckCircle2,
  CircleAlert,
  CircleDot,
  CircleSlash,
  Info,
  OctagonAlert,
  ShieldAlert,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import type { DecisionStatus, InsightStatus, ProjectStatus, ServiceStatus, Severity } from '@/api';
import { cn } from '@/lib/cn';

/** Status always pairs an icon and a label with its colour, and text stays in ink tokens. */
function StatusLabel({
  icon: Icon,
  color,
  label,
  className,
}: {
  icon: LucideIcon;
  color: string;
  label: string;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-ui whitespace-nowrap text-ink-2', className)}>
      <Icon className={cn('size-3.5 shrink-0', color)} aria-hidden />
      {label}
    </span>
  );
}

export const SEVERITY_META: Record<Severity, { label: string; icon: LucideIcon; color: string; bg: string; order: number }> = {
  critical: { label: 'Critical', icon: OctagonAlert, color: 'text-critical', bg: 'bg-critical', order: 0 },
  high: { label: 'High', icon: TriangleAlert, color: 'text-serious', bg: 'bg-serious', order: 1 },
  medium: { label: 'Medium', icon: CircleAlert, color: 'text-warning', bg: 'bg-warning', order: 2 },
  low: { label: 'Low', icon: Info, color: 'text-info', bg: 'bg-info', order: 3 },
};

export function SeverityLabel({ severity, className }: { severity: Severity; className?: string }) {
  const meta = SEVERITY_META[severity];
  return <StatusLabel icon={meta.icon} color={meta.color} label={meta.label} className={className} />;
}

const PROJECT: Record<ProjectStatus, { label: string; icon: LucideIcon; color: string }> = {
  on_track: { label: 'On track', icon: CheckCircle2, color: 'text-good' },
  at_risk: { label: 'At risk', icon: TriangleAlert, color: 'text-warning' },
  blocked: { label: 'Blocked', icon: OctagonAlert, color: 'text-critical' },
  completed: { label: 'Completed', icon: CircleDot, color: 'text-info' },
};

export function ProjectStatusLabel({ status, className }: { status: ProjectStatus; className?: string }) {
  return <StatusLabel {...PROJECT[status]} className={className} />;
}

const SERVICE: Record<ServiceStatus, { label: string; icon: LucideIcon; color: string }> = {
  healthy: { label: 'Healthy', icon: CheckCircle2, color: 'text-good' },
  degraded: { label: 'Degraded', icon: TriangleAlert, color: 'text-serious' },
  at_risk: { label: 'At risk', icon: ShieldAlert, color: 'text-warning' },
};

export function ServiceStatusLabel({ status, className }: { status: ServiceStatus; className?: string }) {
  return <StatusLabel {...SERVICE[status]} className={className} />;
}

const DECISION: Record<DecisionStatus, { label: string; icon: LucideIcon; color: string }> = {
  accepted: { label: 'Accepted', icon: CheckCircle2, color: 'text-good' },
  proposed: { label: 'Proposed', icon: CircleDot, color: 'text-warning' },
  superseded: { label: 'Superseded', icon: CircleSlash, color: 'text-info' },
};

export function DecisionStatusLabel({ status, className }: { status: DecisionStatus; className?: string }) {
  return <StatusLabel {...DECISION[status]} className={className} />;
}

export const INSIGHT_STATUS: Record<InsightStatus, { label: string; icon: LucideIcon; color: string }> = {
  open: { label: 'Open', icon: CircleDot, color: 'text-ink-2' },
  acknowledged: { label: 'Acknowledged', icon: CheckCircle2, color: 'text-ink-3' },
  resolved: { label: 'Resolved', icon: CheckCircle2, color: 'text-good' },
  dismissed: { label: 'Dismissed', icon: CircleSlash, color: 'text-ink-3' },
};

export function InsightStatusLabel({ status, className }: { status: InsightStatus; className?: string }) {
  return <StatusLabel {...INSIGHT_STATUS[status]} className={className} />;
}
