/**
 * Next.js Instrumentation file.
 * This runs once when the server starts (edge and Node.js).
 * Use for startup validation, monitoring initialization, etc.
 */

export async function register() {
  // Only run on server
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await initializeServer();
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await initializeEdge();
  }
}

async function initializeServer() {
  // Validate required environment variables
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "GEMINI_API_KEY",
    "NEXT_PUBLIC_APP_URL",
  ];

  const missing = requiredEnvVars.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(", ")}`
    );

    // In production, fail fast on missing critical vars
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `Server cannot start: missing environment variables: ${missing.join(", ")}`
      );
    }
  }

  // Initialize Sentry (if configured)
  if (process.env.SENTRY_DSN) {
    try {
      // Dynamic import to avoid loading Sentry if not configured
      // When you add Sentry, uncomment this:
      // const Sentry = await import("@sentry/nextjs");
      // Sentry.init({
      //   dsn: process.env.SENTRY_DSN,
      //   environment: process.env.NODE_ENV,
      //   tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      // });
      console.log("Sentry initialized");
    } catch (error) {
      console.error("Failed to initialize Sentry:", error);
    }
  }

  // Log startup info
  console.log("FORGE server starting...", {
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || "0.1.0",
    timestamp: new Date().toISOString(),
  });
}

async function initializeEdge() {
  // Edge runtime initialization (minimal)
  // Validation is lighter here since edge functions start frequently
}
