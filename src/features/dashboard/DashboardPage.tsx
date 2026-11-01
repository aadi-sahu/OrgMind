import { useNavigate } from 'react-router-dom';
import { MessageSquareText } from 'lucide-react';
import { api } from '@/api';
import { Button } from '@/components/ui/Button';
import { PageContainer, PageHeader } from '@/components/ui/Panel';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { useResource } from '@/hooks/useResource';
import { timeAgo } from '@/lib/format';
import { ActivityPanel } from './ActivityPanel';
import { AlertsPanel } from './AlertsPanel';
import { CountsGrid } from './CountsGrid';
import { GraphStatsPanel } from './GraphStatsPanel';
import { HealthPanel } from './HealthPanel';
import { HighlightsPanel } from './HighlightsPanel';
import { SignalsPanel } from './SignalsPanel';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data, error, refetch } = useResource((signal) => api.getOverview(signal));

  if (error) {
    return (
      <PageContainer>
        <ErrorState error={error} onRetry={refetch} className="min-h-[50vh]" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={data?.organizationName ?? <Skeleton className="h-7 w-44" />}
        description={data?.summary ?? <Skeleton className="mt-1.5 h-4 w-96 max-w-full" />}
        actions={
          <>
            {data && (
              <span className="text-meta text-ink-3">
                Model updated <time dateTime={data.modelUpdatedAt}>{timeAgo(data.modelUpdatedAt)}</time>
              </span>
            )}
            <Button
              variant="primary"
              icon={<MessageSquareText className="size-3.5" aria-hidden />}
              onClick={() => navigate('/assistant')}
            >
              Ask OrgMind
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <HealthPanel health={data?.health} className="lg:col-span-5" />
        <div className="flex flex-col gap-4 lg:col-span-7">
          <CountsGrid counts={data?.counts} />
          <GraphStatsPanel graph={data?.graph} className="flex-1" />
        </div>
        <HighlightsPanel highlights={data?.highlights} className="lg:col-span-7" />
        <AlertsPanel className="lg:col-span-5" />
        <SignalsPanel className="lg:col-span-7" />
        <ActivityPanel className="lg:col-span-5 lg:max-h-[420px]" />
      </div>
    </PageContainer>
  );
}
