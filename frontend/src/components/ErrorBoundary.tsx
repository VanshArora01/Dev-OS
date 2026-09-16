import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  resetKey?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryToken: number;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    retryToken: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public componentDidUpdate(prevProps: Props) {
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  private retry = () => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      retryToken: prev.retryToken + 1,
    }));
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-full min-h-[280px] w-full bg-background text-slate-800 dark:text-zinc-200 p-8 flex flex-col items-center justify-center">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Something went wrong</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-4 text-center max-w-md">
            This view hit an unexpected error. Retry remounts it without a full reload.
          </p>
          {this.state.error?.message && (
            <pre className="bg-slate-100 dark:bg-black/40 p-4 rounded-xl text-xs text-rose-500 overflow-auto max-h-40 w-full max-w-xl border border-rose-500/20 mb-4">
              {this.state.error.message}
            </pre>
          )}
          <button
            type="button"
            onClick={this.retry}
            className="h-11 px-6 rounded-full bg-brand text-white font-semibold"
          >
            Retry
          </button>
        </div>
      );
    }

    return <React.Fragment key={this.state.retryToken}>{this.props.children}</React.Fragment>;
  }
}

export default ErrorBoundary;
