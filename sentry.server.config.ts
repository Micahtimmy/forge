import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of transactions

  // Set environment
  environment: process.env.NODE_ENV,

  // Attach release info
  release: process.env.npm_package_version || "0.1.0",

  // Filter out noisy errors
  ignoreErrors: [
    // Rate limiting errors (expected behavior)
    "Rate limit exceeded",
    // Auth errors (expected for unauthenticated users)
    "Authentication required",
  ],
});
