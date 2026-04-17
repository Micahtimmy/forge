import { z } from "zod";

/**
 * Environment variable validation schema.
 * This ensures all required environment variables are present at startup.
 * If any are missing, the application will fail to start with a clear error message.
 */

const serverEnvSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // AI
  GEMINI_API_KEY: z.string().min(1),

  // JIRA (optional - only required if JIRA integration is enabled)
  JIRA_CLIENT_ID: z.string().optional(),
  JIRA_CLIENT_SECRET: z.string().optional(),
  JIRA_REDIRECT_URI: z.string().url().optional(),

  // Inngest (optional for local development)
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),

  // Resend
  RESEND_API_KEY: z.string().optional(),

  // Paystack (optional - only required for billing)
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string().optional(),
  PAYSTACK_SECRET_KEY: z.string().optional(),

  // Sentry (optional - only required for error tracking)
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Validates server environment variables.
 * Call this at application startup (e.g., in instrumentation.ts or layout.tsx).
 */
export function validateServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const missingVars = Object.keys(errors).join(", ");

    console.error("Invalid environment variables:");
    console.error(JSON.stringify(errors, null, 2));

    throw new Error(
      `Missing or invalid environment variables: ${missingVars}. ` +
        `Check your .env.local file or Vercel environment settings.`
    );
  }

  return parsed.data;
}

/**
 * Validates client environment variables.
 * These are safe to expose to the browser.
 */
export function validateClientEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  });

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;

    console.error("Invalid client environment variables:");
    console.error(JSON.stringify(errors, null, 2));

    throw new Error("Missing or invalid client environment variables");
  }

  return parsed.data;
}

// Lazy-initialized server environment (cached after first call)
let _serverEnv: ServerEnv | null = null;

/**
 * Gets validated server environment variables.
 * Caches the result after first validation.
 */
export function getServerEnv(): ServerEnv {
  if (!_serverEnv) {
    _serverEnv = validateServerEnv();
  }
  return _serverEnv;
}

/**
 * Check if a feature is enabled based on environment variables.
 */
export function isFeatureEnabled(feature: "jira" | "billing" | "sentry"): boolean {
  const env = getServerEnv();

  switch (feature) {
    case "jira":
      return Boolean(env.JIRA_CLIENT_ID && env.JIRA_CLIENT_SECRET);
    case "billing":
      return Boolean(env.PAYSTACK_SECRET_KEY);
    case "sentry":
      return Boolean(env.SENTRY_DSN);
    default:
      return false;
  }
}
