import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, CircleDashed, FlaskConical, Info, KeyRound, PlugZap, SearchX } from 'lucide-react';
import { api, isDemoMode, type Integration, type IntegrationStatus } from '@/api';
import { SystemMark } from '@/components/domain/SystemMark';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Menu';
import { Dialog } from '@/components/ui/Overlay';
import { PageContainer, PageHeader, Panel } from '@/components/ui/Panel';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { useResource } from '@/hooks/useResource';
import { cn } from '@/lib/cn';
import { timeAgo } from '@/lib/format';

const STATUS_META: Record<IntegrationStatus, { label: string; icon: typeof CheckCircle2; color: string }> = {
  not_connected: { label: 'Not connected', icon: CircleDashed, color: 'text-ink-3' },
  connected: { label: 'Connected', icon: CheckCircle2, color: 'text-good' },
  // Deliberately not green, and never labelled "Connected": no real connection exists.
  simulated: { label: 'Simulated', icon: FlaskConical, color: 'text-warning' },
  error: { label: 'Connection error', icon: AlertCircle, color: 'text-critical' },
};

function StatusPill({ status }: { status: IntegrationStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-meta whitespace-nowrap text-ink-2">
      <Icon className={cn('size-3.5', meta.color)} aria-hidden />
      {meta.label}
    </span>
  );
}

function ConnectDialog({
  integration,
  busy,
  onConfirm,
  onClose,
}: {
  integration: Integration;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      title={`Connect ${integration.name}`}
      description={integration.description}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" loading={busy} onClick={onConfirm} data-autofocus>
            {isDemoMode ? 'Simulate connection' : `Continue to ${integration.name}`}
          </Button>
        </>
      }
    >
      {isDemoMode && (
        <p className="mb-4 flex gap-2 rounded-md border border-line-strong bg-surface-2 p-2.5 text-ui text-ink">
          <FlaskConical className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
          <span>
            No backend is running, so this will not connect to {integration.name}. Nothing is authorized and no data
            is read. It only shows how the connected state will look.
          </span>
        </p>
      )}
      <dl className="space-y-3 text-ui">
        <div>
          <dt className="text-meta font-medium text-ink-3">How it authorizes</dt>
          <dd className="mt-0.5 flex items-center gap-1.5 text-ink">
            <KeyRound className="size-3.5 text-ink-3" aria-hidden />
            {integration.authMethod}
          </dd>
        </div>
        <div>
          <dt className="text-meta font-medium text-ink-3">Read-only access it would request</dt>
          <dd className="mt-1 flex flex-wrap gap-1">
            {integration.scopes.map((scope) => (
              <Badge key={scope} className="font-mono">{scope}</Badge>
            ))}
          </dd>
        </div>
        <div>
          <dt className="text-meta font-medium text-ink-3">What OrgMind would learn from it</dt>
          <dd className="mt-0.5 text-ink-2">{integration.ingests.join(', ')}</dd>
        </div>
      </dl>
    </Dialog>
  );
}

function DisconnectDialog({
  integration,
  busy,
  onConfirm,
  onClose,
}: {
  integration: Integration;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      title={`Disconnect ${integration.name}?`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={busy} data-autofocus>
            Cancel
          </Button>
          <Button variant="danger" loading={busy} onClick={onConfirm}>
            Disconnect
          </Button>
        </>
      }
    >
      <p className="text-ui text-ink-2">
        {integration.status === 'simulated'
          ? 'This clears the simulated state. No real connection exists, so nothing else changes.'
          : `OrgMind will stop syncing from ${integration.name}. Knowledge already in the graph stays until you remove it.`}
      </p>
    </Dialog>
  );
}

function IntegrationCard({
  integration,
  onConnect,
  onDisconnect,
}: {
  integration: Integration;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const linked = integration.status === 'connected' || integration.status === 'simulated' || integration.status === 'error';

  return (
    <Panel className="flex flex-col p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-surface-2 text-ink">
          <SystemMark id={integration.id} className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-ui font-medium text-ink">{integration.name}</h3>
          <p className="text-meta text-ink-3">{integration.category}</p>
        </div>
        <StatusPill status={integration.status} />
      </div>

      <p className="mt-3 text-ui text-ink-2">{integration.description}</p>

      <div className="mt-3 flex flex-wrap gap-1">
        {integration.ingests.map((item) => (
          <Badge key={item}>{item}</Badge>
        ))}
      </div>

      <div className="mt-auto pt-4">
        {integration.status === 'simulated' && (
          <p className="mb-3 text-meta text-ink-3">
            Simulated {integration.connectedAt ? timeAgo(integration.connectedAt) : ''}. {integration.statusDetail}
          </p>
        )}
        {integration.status === 'connected' && integration.lastSyncAt && (
          <p className="mb-3 text-meta text-ink-3">Last synced {timeAgo(integration.lastSyncAt)}</p>
        )}
        {integration.status === 'error' && integration.statusDetail && (
          <p className="mb-3 text-meta text-ink-2">{integration.statusDetail}</p>
        )}
        {linked ? (
          <Button className="w-full" aria-label={`Disconnect ${integration.name}`} onClick={onDisconnect}>
            Disconnect
          </Button>
        ) : (
          <Button className="w-full" aria-label={`Connect ${integration.name}`} onClick={onConnect}>
            Connect
          </Button>
        )}
      </div>
    </Panel>
  );
}

type StatusFilter = 'all' | IntegrationStatus;

export default function IntegrationsPage() {
  const { data, loading, error, refetch, setData } = useResource((signal) => api.listIntegrations(signal));
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [category, setCategory] = useState('all');
  const [connecting, setConnecting] = useState<Integration | null>(null);
  const [disconnecting, setDisconnecting] = useState<Integration | null>(null);
  const [busy, setBusy] = useState(false);

  const replace = (updated: Integration) =>
    setData((current) => current?.map((item) => (item.id === updated.id ? updated : item)));

  const confirmConnect = async () => {
    if (!connecting) return;
    setBusy(true);
    try {
      const result = await api.connectIntegration(connecting.id);
      if (result.kind === 'redirect') {
        window.location.assign(result.authorizeUrl);
        return;
      }
      replace(result.integration);
      toast(
        result.integration.status === 'simulated'
          ? `${connecting.name} is simulated. No real connection was made.`
          : `${connecting.name} connected`,
        result.integration.status === 'simulated' ? 'info' : 'success',
      );
      setConnecting(null);
    } catch (reason) {
      toast(reason instanceof Error ? reason.message : `Could not connect ${connecting.name}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  const confirmDisconnect = async () => {
    if (!disconnecting) return;
    setBusy(true);
    try {
      replace(await api.disconnectIntegration(disconnecting.id));
      toast(`${disconnecting.name} disconnected`, 'info');
      setDisconnecting(null);
    } catch (reason) {
      toast(reason instanceof Error ? reason.message : `Could not disconnect ${disconnecting.name}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  const categories = useMemo(() => [...new Set((data ?? []).map((item) => item.category))], [data]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter(
      (item) =>
        (statusFilter === 'all' || item.status === statusFilter) &&
        (category === 'all' || item.category === category) &&
        (!q || `${item.name} ${item.category} ${item.description}`.toLowerCase().includes(q)),
    );
  }, [data, query, statusFilter, category]);

  const connectedCount = (data ?? []).filter((item) => item.status === 'connected').length;
  const simulatedCount = (data ?? []).filter((item) => item.status === 'simulated').length;
  const total = data?.length ?? 0;

  return (
    <PageContainer>
      <PageHeader
        title="Integrations"
        description="Connect the systems where your organization's knowledge lives. OrgMind only requests read access."
        actions={
          data && (
            <p className="tabular text-meta text-ink-3" aria-live="polite">
              {connectedCount} of {total} connected
              {simulatedCount > 0 ? `, ${simulatedCount} simulated` : ''}
            </p>
          )
        }
      />

      {isDemoMode && (
        <div className="mb-4 flex gap-2.5 rounded-lg border border-line-strong bg-surface p-3">
          <Info className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
          <p className="text-ui text-ink-2">
            <span className="font-medium text-ink">No integrations are actually connected.</span> The backend is not
            running, so Connect only simulates the UI state and never contacts these services. The activity shown on
            other pages is sample data, not synced from these tools.
          </p>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput
          label="Search integrations"
          placeholder="Search integrations"
          value={query}
          onChange={setQuery}
          containerClassName="w-full sm:w-64"
        />
        <Select
          label="Filter by category"
          value={category}
          onChange={setCategory}
          options={[{ value: 'all', label: 'All categories' }, ...categories.map((value) => ({ value, label: value }))]}
        />
        <Select<StatusFilter>
          label="Filter by status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'not_connected', label: 'Not connected' },
            ...(isDemoMode
              ? [{ value: 'simulated' as const, label: 'Simulated' }]
              : [
                  { value: 'connected' as const, label: 'Connected' },
                  { value: 'error' as const, label: 'Connection error' },
                ]),
          ]}
        />
      </div>

      {error ? (
        <Panel>
          <ErrorState error={error} onRetry={refetch} />
        </Panel>
      ) : loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading integrations">
          {Array.from({ length: 7 }, (_, i) => (
            <Panel key={i} className="p-4">
              <Skeleton className="h-9 w-36" />
              <Skeleton className="mt-4 h-3.5 w-full" />
              <Skeleton className="mt-2 h-3.5 w-2/3" />
              <Skeleton className="mt-6 h-8 w-full" />
            </Panel>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<SearchX className="size-4" aria-hidden />}
            title="No integrations match"
            description="Try a different search or filter."
          />
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onConnect={() => setConnecting(integration)}
              onDisconnect={() => setDisconnecting(integration)}
            />
          ))}
          <Panel className="flex flex-col items-center justify-center border-dashed bg-transparent p-4 text-center">
            <PlugZap className="size-4 text-ink-3" aria-hidden />
            <p className="mt-2 text-ui text-ink-2">CI/CD pipelines and internal APIs are also planned as data sources.</p>
          </Panel>
        </div>
      )}

      {connecting && <ConnectDialog integration={connecting} busy={busy} onConfirm={confirmConnect} onClose={() => !busy && setConnecting(null)} />}
      {disconnecting && <DisconnectDialog integration={disconnecting} busy={busy} onConfirm={confirmDisconnect} onClose={() => !busy && setDisconnecting(null)} />}
    </PageContainer>
  );
}
