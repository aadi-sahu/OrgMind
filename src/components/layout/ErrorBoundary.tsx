import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from '@/components/ui/States';

interface Props {
  children: ReactNode;
}

interface State {
  error?: Error;
}

/** How Chrome, Firefox and Safari report that a lazy-loaded page failed to download. */
const CHUNK_LOAD_ERROR = /dynamically imported module|module script failed/i;

/** Keeps a rendering failure in one page from taking down the navigation around it. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Page failed to render', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    // React caches a failed lazy import, and a new release replaces the old files, so only a reload can recover.
    if (CHUNK_LOAD_ERROR.test(error.message)) {
      return (
        <ErrorState
          error={new Error('This page could not be downloaded. Check your connection, or reload to get the latest version.')}
          onRetry={() => window.location.reload()}
          className="min-h-[50vh]"
        />
      );
    }
    return <ErrorState error={error} onRetry={() => this.setState({ error: undefined })} className="min-h-[50vh]" />;
  }
}
