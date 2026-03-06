import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-bg px-4">
        <div className="w-full max-w-md rounded-xl border border-terracotta/30 bg-terracotta/5 p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-terracotta" />
          <h2 className="mb-2 font-serif text-xl font-bold text-text-primary">
            Something went wrong
          </h2>
          <p className="mb-6 text-sm text-text-secondary">
            An unexpected error occurred. You can try reloading the page or
            returning to the home page.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
            <Button size="sm" asChild>
              <Link to="/">Return Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
