import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./ui";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Studio crashed:", error, errorInfo);
  }

  override render() {
    if (this.state.error) {
      return (
        <main className="app-frame app-frame--error" aria-labelledby="app-title">
          <section className="app-error" role="alert">
            <p className="eyebrow">Studio Error</p>
            <h1 id="app-title">The studio could not continue.</h1>
            <p>
              {this.state.error.message ||
                "An unexpected browser error interrupted the workspace."}
            </p>
            <Button onClick={() => window.location.reload()} variant="primary">
              Reload studio
            </Button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
