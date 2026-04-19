"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface OnboardingData {
  workspaceName: string;
  teamSize: string;
  role: string;
}

// Map onboarding roles to DB roles
const ROLE_MAP: Record<string, string> = {
  scrum_master: "sm",
  product_manager: "pm",
  program_manager: "pgm",
  rte: "rte",
  engineering_manager: "admin",
  other: "pm",
};

export async function completeOnboarding(data: OnboardingData) {
  console.log("=== ONBOARDING: Starting ===", data);

  const supabase = await createSupabaseServerClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log("=== ONBOARDING: User check ===", { userId: user?.id, error: userError?.message });

  if (userError || !user) {
    console.error("Onboarding: Not authenticated", userError);
    return {
      success: false,
      error: "Not authenticated",
    };
  }

  // Generate a slug from workspace name
  const slug = data.workspaceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    + "-" + Date.now().toString(36);

  // Map role to DB-compatible value
  const dbRole = ROLE_MAP[data.role] || "pm";

  try {
    // Use admin client to bypass RLS during onboarding
    const adminClient = createSupabaseAdminClient();

    // Step 1: Create workspace
    const { data: workspace, error: workspaceError } = await adminClient
      .from("workspaces")
      .insert({
        name: data.workspaceName,
        slug: slug,
      })
      .select("id, name")
      .single();

    if (workspaceError) {
      console.error("Workspace creation error:", workspaceError);
      return {
        success: false,
        error: `Failed to create workspace: ${workspaceError.message}`,
      };
    }

    // Step 2: Create user profile
    const { error: profileError } = await adminClient
      .from("users")
      .upsert({
        id: user.id,
        email: user.email || "",
        display_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
        role: dbRole,
        workspace_id: workspace.id,
      }, {
        onConflict: "id",
      });

    if (profileError) {
      console.error("Profile update error:", profileError);
      // Try to delete the workspace we just created
      await adminClient.from("workspaces").delete().eq("id", workspace.id);
      return {
        success: false,
        error: `Failed to update profile: ${profileError.message}`,
      };
    }

    console.log("=== ONBOARDING: Success! ===", { workspaceId: workspace.id });
    revalidatePath("/");

    return {
      success: true,
      workspaceId: workspace.id,
    };
  } catch (error) {
    console.error("=== ONBOARDING: Unexpected error ===", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

export async function getOnboardingStatus() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { completed: false, needsOnboarding: false };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  // User needs onboarding if they don't have a profile or don't have a workspace
  const needsOnboarding = !profile || !profile.workspace_id;

  return {
    completed: !!profile?.workspace_id,
    needsOnboarding,
  };
}
