import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Info, XCircle } from 'lucide-react';

type Tone = 'success' | 'info' | 'error';

interface Toast {
  id: number;
  tone: Tone;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, tone?: Tone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<Tone, ReactNode> = {
  success: <CheckCircle2 className="size-4 shrink-0 text-good" aria-hidden />,
  info: <Info className="size-4 shrink-0 text-ink-3" aria-hidden />,
  error: <XCircle className="size-4 shrink-0 text-critical" aria-hidden />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const toast = useCallback((message: string, tone: Tone = 'success') => {
    const id = nextId.current++;
    setToasts((current) => [...current.slice(-2), { id, tone, message }]);
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 4000);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div role="status" aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 left-4 z-50 flex flex-col items-end gap-2 sm:left-auto">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto flex max-w-sm animate-rise items-start gap-2 rounded-lg bg-surface-2 px-3 py-2.5 text-ui text-ink shadow-pop">
              {ICONS[t.tone]}
              <span>{t.message}</span>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context.toast;
}
