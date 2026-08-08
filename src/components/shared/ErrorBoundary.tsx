import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Branded fallback + console.error of the stack as required
    console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
  }

  handleRetry = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-[60vh] grid place-items-center p-6 bg-background text-foreground">
        <div className="max-w-md w-full rounded-2xl border border-border/60 bg-card p-6 text-center space-y-4">
          <div className="mx-auto w-10 h-10 rounded-xl bg-destructive/10 text-destructive grid place-items-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h2 className="font-['Instrument_Serif'] text-2xl">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">An unexpected error was caught by our boundary. Your data is safe — try again or return home.</p>
          {this.state.error && (
            <pre className="text-left text-[11px] bg-muted/40 border border-border/60 rounded-lg p-2 overflow-auto max-h-24">{String(this.state.error.stack || this.state.error.message)}</pre>
          )}
          <div className="flex gap-2 justify-center">
            <Button onClick={this.handleRetry}>Try again</Button>
            <Button variant="outline" asChild>
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
