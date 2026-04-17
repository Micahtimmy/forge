import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

export type AuthenticatedContext = {
  user: User;
  workspaceId: string;
  role: "owner" | "admin" | "member";
};

export type AuthResult =
  | { success: true; context: AuthenticatedContext }
  | { success: false; response: NextResponse };

/**
 * Authenticates an API request and returns user context with workspace info.
 * Returns a 401 response if not authenticated, 400 if no workspace found.
 *
 * Usage:
 * ```ts
 * export async function POST(req: NextRequest) {
 *   const auth = await authenticateRequest();
 *   if (!auth.success) return auth.response;
 *
 *   const { user, workspaceId, role } = auth.context;
 *   // ... rest of handler
 * }
 * ```
 */
export async function authenticateRequest(): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  // Get user's workspace membership
  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .single();

  if (membershipError || !membership) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: "No workspace found. Please complete onboarding." },
        { status: 400 }
      ),
    };
  }

  return {
    success: true,
    context: {
      user,
      workspaceId: membership.workspace_id as string,
      role: membership.role as "owner" | "admin" | "member",
    },
  };
}

/**
 * Authenticates an API request without requiring workspace membership.
 * Useful for onboarding flows where user exists but hasn't joined a workspace.
 */
export async function authenticateUserOnly(): Promise<
  | { success: true; user: User }
  | { success: false; response: NextResponse }
> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  return { success: true, user };
}

/**
 * Checks if user has required role (owner or admin can do admin actions).
 */
export function requireRole(
  context: AuthenticatedContext,
  requiredRole: "owner" | "admin" | "member"
): NextResponse | null {
  const roleHierarchy = { owner: 3, admin: 2, member: 1 };

  if (roleHierarchy[context.role] < roleHierarchy[requiredRole]) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  return null;
}
