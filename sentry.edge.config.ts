import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Performance Monitoring - lower for edge
  tracesSampleRate: 0.05, // 5% of transactions

  // Set environment
  environment: process.env.NODE_ENV,
});
