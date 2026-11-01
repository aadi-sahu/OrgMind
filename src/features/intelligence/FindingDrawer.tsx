import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CheckCheck, EyeOff, MessageSquareText, RotateCcw } from 'lucide-react';
import { isDemoMode, type Insight, type InsightStatus } from '@/api';
import { EntityChip } from '@/components/domain/entity';
import { InsightStatusLabel, SeverityLabel } from '@/components/domain/status';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Overlay';
import { useToast } from '@/components/ui/Toast';
import { useInsights } from '@/hooks/useInsights';
import { useOrgData } from '@/hooks/useOrgData';
import { assistantPath } from '@/lib/entities';
import { formatDateTime } from '@/lib/format';
import { EvidenceCard } from './EvidenceCard';
import { CATEGORY_META } from './meta';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="mb-1.5 text-meta font-medium text-ink-3">{title}</h3>
      {children}
    </section>
  );
}

const STATUS_MESSAGE: Record<InsightStatus, string> = {
  open: 'Finding reopened',
  acknowledged: 'Finding acknowledged',
  resolved: 'Finding marked as resolved',
  dismissed: 'Finding dismissed',
};

export function FindingDrawer({ insight, onClose }: { insight: Insight; onClose: () => void }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { updateStatus } = useInsights();
  const { node } = useOrgData();
  const [pending, setPending] = useState<InsightStatus | null>(null);
  const category = CATEGORY_META[insight.category];
  const CategoryIcon = category.icon;

  const changeStatus = async (status: InsightStatus) => {
    setPending(status);
    try {
      await updateStatus(insight.id, status);
      toast(STATUS_MESSAGE[status]);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not update this finding', 'error');
    } finally {
      setPending(null);
    }
  };

  const isClosed = insight.status === 'resolved' || insight.status === 'dismissed';

  return (
    <Drawer
      title={insight.title}
      description={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <SeverityLabel severity={insight.severity} />
          <InsightStatusLabel status={insight.status} />
          <span className="inline-flex items-center gap-1.5 text-ui text-ink-2">
            <CategoryIcon className="size-3.5 text-ink-3" aria-hidden />
            {category.label}
          </span>
        </span>
      }
      onClose={onClose}
      footer={
        <>
          {isClosed ? (
            <Button loading={pending === 'open'} icon={<RotateCcw className="size-3.5" aria-hidden />} onClick={() => changeStatus('open')}>
              Reopen
            </Button>
          ) : (
            <>
              {insight.status !== 'acknowledged' && (
                <Button loading={pending === 'acknowledged'} icon={<Check className="size-3.5" aria-hidden />} onClick={() => changeStatus('acknowledged')}>
                  Acknowledge
                </Button>
              )}
              <Button loading={pending === 'resolved'} icon={<CheckCheck className="size-3.5" aria-hidden />} onClick={() => changeStatus('resolved')}>
                Resolve
              </Button>
              <Button variant="ghost" loading={pending === 'dismissed'} icon={<EyeOff className="size-3.5" aria-hidden />} onClick={() => changeStatus('dismissed')}>
                Dismiss
              </Button>
            </>
          )}
          <Button
            className="ml-auto"
            icon={<MessageSquareText className="size-3.5" aria-hidden />}
            onClick={() => navigate(assistantPath(insight.title))}
          >
            Ask OrgMind
          </Button>
        </>
      }
    >
      <p className="text-body text-ink">{insight.summary}</p>

      <Section title="Why it matters">
        <p className="text-ui text-ink-2">{insight.impact}</p>
      </Section>

      <Section title="Recommended actions">
        <ol className="space-y-1.5">
          {insight.recommendations.map((recommendation, index) => (
            <li key={recommendation} className="flex gap-2.5 text-ui text-ink">
              <span className="tabular mt-px flex size-4.5 shrink-0 items-center justify-center rounded-full border border-line-strong text-micro text-ink-3">
                {index + 1}
              </span>
              {recommendation}
            </li>
          ))}
        </ol>
      </Section>

      <Section title={`Evidence (${insight.evidence.length})${isDemoMode ? ', sample' : ''}`}>
        <ul className="space-y-2">
          {insight.evidence.map((item) => (
            <li key={item.title}>
              <EvidenceCard item={item} />
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Affected">
        <div className="flex flex-wrap gap-1.5">
          {insight.entityIds.map((id) => (
            <EntityChip key={id} id={id} />
          ))}
        </div>
      </Section>

      <p className="mt-5 border-t border-line pt-3 text-meta text-ink-3">
        Detected {formatDateTime(insight.detectedAt)} · {Math.round(insight.confidence * 100)}% confidence · Owner: {node(insight.ownerTeamId)?.name ?? 'Unassigned'}
      </p>
    </Drawer>
  );
}
