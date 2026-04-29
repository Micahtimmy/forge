"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const onboardingSchema = z.object({
  workspaceName: z.string().min(2, "Workspace name must be at least 2 characters").max(100),
  teamSize: z.string().min(1, "Please select a team size"),
  role: z.string().min(1, "Please select a role"),
});

// Map onboarding roles to DB roles
const ROLE_MAP: Record<string, string> = {
  scrum_master: "sm",
  product_manager: "pm",
  program_manager: "pgm",
  rte: "rte",
  engineering_manager: "admin",
  other: "pm",
};

export async function completeOnboarding(data: unknown) {
  const parsed = onboardingSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  const { workspaceName, teamSize, role } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: "Not authenticated",
    };
  }

  // Generate a slug from workspace name
  const slug = workspaceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    + "-" + Date.now().toString(36);

  // Map role to DB-compatible value
  const dbRole = ROLE_MAP[role] || "pm";

  try {
    // Use admin client to bypass RLS during onboarding
    const adminClient = createSupabaseAdminClient();

    // Verify admin client is working
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
      return {
        success: false,
        error: "Server configuration error. Please contact support.",
      };
    }

    console.log("Starting onboarding for user:", user.id, "workspace:", workspaceName);

    // Step 1: Create workspace
    const { data: workspace, error: workspaceError } = await adminClient
      .from("workspaces")
      .insert({
        name: workspaceName,
        slug: slug,
        team_size: teamSize,
        created_by: user.id,
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

    console.log("Workspace created:", workspace.id);

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
      console.error("Profile creation error:", profileError);
      await adminClient.from("workspaces").delete().eq("id", workspace.id);
      return {
        success: false,
        error: `Failed to create profile: ${profileError.message}`,
      };
    }

    console.log("User profile created for:", user.id);

    // Step 3: Create workspace membership (required for JIRA auth and other features)
    const { error: membershipError } = await adminClient
      .from("workspace_members")
      .upsert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: "owner",
      }, {
        onConflict: "workspace_id,user_id",
      });

    if (membershipError) {
      console.error("Membership creation error:", membershipError);
      // Clean up on failure
      await adminClient.from("users").delete().eq("id", user.id);
      await adminClient.from("workspaces").delete().eq("id", workspace.id);
      return {
        success: false,
        error: `Failed to set up membership: ${membershipError.message}`,
      };
    }

    console.log("Workspace membership created. Onboarding complete!");

    revalidatePath("/");

    return {
      success: true,
      workspaceId: workspace.id,
    };
  } catch (err) {
    console.error("Onboarding unexpected error:", err);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
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
