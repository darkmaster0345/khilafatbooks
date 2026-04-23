import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidMount() {
    window.addEventListener('error', this.handleWindowError);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.handleWindowError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleWindowError = (event: ErrorEvent) => {
    this.setState({
      hasError: true,
      error: event.error instanceof Error ? event.error : new Error(event.message || 'Unhandled window error'),
    });
  };

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason || 'Unhandled promise rejection'));
    this.setState({ hasError: true, error: reason });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <div className="flex gap-3">
            <Button onClick={this.handleReset} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" /> Try Again
            </Button>
            <Button onClick={() => window.location.href = '/'}>Go Home</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
