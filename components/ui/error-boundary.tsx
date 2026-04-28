"use client";

import { Component, type ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as Sentry from "@sentry/nextjs";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset?: () => void;
}

export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-coral-dim flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-coral" />
      </div>

      <h2 className="text-xl font-semibold text-text-primary mb-2">
        Something went wrong
      </h2>

      <p className="text-sm text-text-secondary max-w-md mb-6">
        We encountered an unexpected error. This has been reported to our team.
        {process.env.NODE_ENV === "development" && error && (
          <span className="block mt-2 font-mono text-xs text-coral">
            {error.message}
          </span>
        )}
      </p>

      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={onReset}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        <Button
          variant="ghost"
          onClick={() => (window.location.href = "/")}
        >
          <Home className="w-4 h-4 mr-2" />
          Go Home
        </Button>
      </div>
    </motion.div>
  );
}

export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onReset={() => window.location.reload()}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Minimal error boundary for layout elements (sidebar, topbar)
 * Shows a minimal error state that doesn't break the page layout
 */
export function LayoutErrorBoundary({
  children,
  name,
}: {
  children: ReactNode;
  name: string;
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center p-4 text-text-tertiary text-xs">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {name} unavailable
        </div>
      }
      onReset={() => window.location.reload()}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error boundary for AI/async features that can fail gracefully
 */
export function FeatureErrorBoundary({
  children,
  featureName,
  onRetry,
}: {
  children: ReactNode;
  featureName: string;
  onRetry?: () => void;
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="rounded-lg border border-border-default bg-surface-01 p-4">
          <div className="flex items-center gap-2 text-amber mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">{featureName} unavailable</span>
          </div>
          <p className="text-xs text-text-secondary mb-3">
            This feature encountered an error. Your data is safe.
          </p>
          {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
