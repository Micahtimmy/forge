"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary for the application.
 * Catches unhandled errors and displays a user-friendly message.
 * In production, error details are logged but not shown to users.
 */
export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service (Sentry in production)
    console.error("Application error:", error);

    // In production, you would send this to Sentry:
    // Sentry.captureException(error);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-coral/10">
          <AlertCircle className="h-8 w-8 text-coral" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-text-primary">
            Something went wrong
          </h1>
          <p className="text-text-secondary">
            We encountered an unexpected error. Our team has been notified.
          </p>
        </div>

        {isDev && (
          <div className="rounded-lg border border-border-subtle bg-surface-01 p-4 text-left">
            <p className="mb-2 text-sm font-medium text-coral">
              Development Error Details:
            </p>
            <pre className="overflow-auto text-xs text-text-secondary">
              {error.message}
            </pre>
            {error.digest && (
              <p className="mt-2 text-xs text-text-muted">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {!isDev && error.digest && (
          <p className="text-sm text-text-muted">Error ID: {error.digest}</p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            variant="primary"
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Try again
          </Button>

          <Button variant="secondary" onClick={() => window.location.href = "/"}>
            <Home className="h-4 w-4" />
            Go to dashboard
          </Button>
        </div>

        <p className="text-sm text-text-muted">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}
