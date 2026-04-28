import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Default query timeout in milliseconds (30 seconds)
const DEFAULT_STATEMENT_TIMEOUT_MS = 30000;

// Browser client (for client-side usage)
export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

// Server client with anon key (for server components with RLS)
export function createServerClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        // Prevent runaway queries from blocking the connection
        "x-statement-timeout": String(DEFAULT_STATEMENT_TIMEOUT_MS),
      },
    },
  });
}

// Admin client with service role key (bypasses RLS - use carefully)
export function createAdminClient() {
  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        "x-statement-timeout": String(DEFAULT_STATEMENT_TIMEOUT_MS),
      },
    },
  });
}

// Untyped Admin client (for dynamic queries)
export function createUntypedAdminClient() {
  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        "x-statement-timeout": String(DEFAULT_STATEMENT_TIMEOUT_MS),
      },
    },
  });
}

// Default export for simple server-side usage
export const supabase = createServerClient();

// Untyped client for queries against tables not yet in the type file
// Use this sparingly - prefer adding types to supabase.ts
export function createUntypedServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        "x-statement-timeout": String(DEFAULT_STATEMENT_TIMEOUT_MS),
      },
    },
  });
}
