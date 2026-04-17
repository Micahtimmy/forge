"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { WorkspaceInsert, UserInsert } from "@/types/supabase";

interface OnboardingData {
  workspaceName: string;
  teamSize: string;
  role: string;
}

export async function completeOnboarding(data: OnboardingData) {
  const supabase = await createSupabaseServerClient();

  // Get current user
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
  const slug = data.workspaceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  // Create workspace
  const workspaceData: WorkspaceInsert = {
    name: data.workspaceName,
    slug: slug + "-" + Date.now().toString(36),
    team_size: data.teamSize,
    created_by: user.id,
  };

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .insert(workspaceData)
    .select("id, name")
    .single();

  if (workspaceError) {
    console.error("Workspace creation error:", workspaceError);
    return {
      success: false,
      error: "Failed to create workspace",
    };
  }

  // Update user profile with role and workspace
  const userData: UserInsert = {
    id: user.id,
    email: user.email || "",
    full_name: user.user_metadata?.full_name || "",
    role: data.role,
    workspace_id: workspace.id,
    onboarding_completed: true,
    updated_at: new Date().toISOString(),
  };

  const { error: profileError } = await supabase
    .from("users")
    .upsert(userData);

  if (profileError) {
    console.error("Profile update error:", profileError);
    return {
      success: false,
      error: "Failed to update profile",
    };
  }

  // Add user as workspace admin
  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: "admin",
    });

  if (memberError) {
    console.error("Workspace member error:", memberError);
    // Non-critical, continue anyway
  }

  revalidatePath("/");

  return {
    success: true,
    workspaceId: workspace.id,
  };
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
    .select("onboarding_completed")
    .eq("id", user.id)
    .single<{ onboarding_completed: boolean | null }>();

  return {
    completed: profile?.onboarding_completed ?? false,
    needsOnboarding: !profile?.onboarding_completed,
  };
}
