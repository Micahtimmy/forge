import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Health check endpoint for monitoring.
 * Returns status of all critical dependencies.
 */
export async function GET() {
  const checks: Record<string, { status: "healthy" | "unhealthy"; latencyMs?: number; error?: string }> = {};

  // Check Supabase connection
  const supabaseStart = Date.now();
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Simple health check query
    const { error } = await supabase.from("workspaces").select("id").limit(1);

    checks.database = {
      status: error ? "unhealthy" : "healthy",
      latencyMs: Date.now() - supabaseStart,
      ...(error && { error: "Database connection failed" }),
    };
  } catch (e) {
    checks.database = {
      status: "unhealthy",
      latencyMs: Date.now() - supabaseStart,
      error: "Database connection failed",
    };
  }

  // Check if required environment variables are present
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "GEMINI_API_KEY",
    "NEXT_PUBLIC_APP_URL",
  ];

  const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);

  checks.environment = {
    status: missingEnvVars.length === 0 ? "healthy" : "unhealthy",
    ...(missingEnvVars.length > 0 && {
      error: `Missing environment variables: ${missingEnvVars.length}`,
    }),
  };

  // Overall status
  const allHealthy = Object.values(checks).every((c) => c.status === "healthy");

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.1.0",
      checks,
    },
    {
      status: allHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
