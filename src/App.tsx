import { lazy } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ToastProvider } from '@/components/ui/Toast';
import { InsightsProvider } from '@/hooks/useInsights';
import { OrgDataProvider } from '@/hooks/useOrgData';
import { ThemeProvider } from '@/hooks/useTheme';

// Pages load on demand, which keeps charts and the graph out of the first bundle.
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const GraphPage = lazy(() => import('@/features/graph/GraphPage'));
const AssistantPage = lazy(() => import('@/features/assistant/AssistantPage'));
const IntelligencePage = lazy(() => import('@/features/intelligence/IntelligencePage'));
const ExplorerPage = lazy(() => import('@/features/explorer/ExplorerPage'));
const IntegrationsPage = lazy(() => import('@/features/integrations/IntegrationsPage'));
const NotFoundPage = lazy(() => import('@/features/NotFoundPage'));

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/graph', element: <GraphPage /> },
      { path: '/assistant', element: <AssistantPage /> },
      { path: '/intelligence', element: <IntelligencePage /> },
      { path: '/explorer', element: <Navigate to="/explorer/people" replace /> },
      { path: '/explorer/:segment/:id?', element: <ExplorerPage /> },
      { path: '/integrations', element: <IntegrationsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <OrgDataProvider>
          <InsightsProvider>
            <RouterProvider router={router} />
          </InsightsProvider>
        </OrgDataProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
