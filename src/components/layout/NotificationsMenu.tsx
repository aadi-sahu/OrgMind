import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { IconButton } from '@/components/ui/Button';
import { Popover } from '@/components/ui/Popover';
import { SEVERITY_META } from '@/components/domain/status';
import { useInsights } from '@/hooks/useInsights';
import { timeAgo } from '@/lib/format';

export function NotificationsMenu() {
  const { alerts } = useInsights();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <IconButton
        ref={anchorRef}
        label={alerts.length > 0 ? `Notifications, ${alerts.length} urgent` : 'Notifications'}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative"
      >
        <Bell className="size-4" aria-hidden />
        {alerts.length > 0 && (
          <span className="tabular absolute top-0.5 right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-serious px-0.5 text-[9px] font-semibold text-black">
            {alerts.length}
          </span>
        )}
      </IconButton>
      <Popover open={open} onClose={close} anchorRef={anchorRef} align="end" className="w-[360px]">
        <div className="flex items-center justify-between border-b border-line-strong px-3 py-2.5">
          <p className="text-ui font-medium text-ink">Risks and alerts</p>
          <span className="tabular text-meta text-ink-3">{alerts.length} urgent</span>
        </div>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <CheckCheck className="size-5 text-good" aria-hidden />
            <p className="text-ui text-ink-2">No urgent findings are open.</p>
          </div>
        ) : (
          <ul className="max-h-[360px] overflow-y-auto p-1">
            {alerts.map((alert) => {
              const meta = SEVERITY_META[alert.severity];
              const Icon = meta.icon;
              return (
                <li key={alert.id}>
                  <Link
                    to={`/intelligence?finding=${alert.id}`}
                    onClick={close}
                    className="flex gap-2.5 rounded px-2 py-2 hover:bg-surface-3"
                  >
                    <Icon className={`mt-0.5 size-3.5 shrink-0 ${meta.color}`} aria-label={meta.label} />
                    <span className="min-w-0">
                      <span className="block text-ui text-ink">{alert.title}</span>
                      <span className="block text-meta text-ink-3">
                        {meta.label} · {timeAgo(alert.detectedAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <div className="border-t border-line-strong p-1">
          <Link to="/intelligence" onClick={close} className="block rounded px-2 py-1.5 text-center text-ui text-ink-2 hover:bg-surface-3 hover:text-ink">
            View all findings
          </Link>
        </div>
      </Popover>
    </>
  );
}
