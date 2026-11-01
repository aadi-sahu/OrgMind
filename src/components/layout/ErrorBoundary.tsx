import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from '@/components/ui/States';

interface Props {
  children: ReactNode;
}

interface State {
  error?: Error;
}

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
    if (this.state.error) {
      return <ErrorState error={this.state.error} onRetry={() => this.setState({ error: undefined })} className="min-h-[50vh]" />;
    }
    return this.props.children;
  }
}
