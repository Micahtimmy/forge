import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  job_title?: string | null;
  timezone?: string | null;
  avatar_url: string | null;
  role: string | null;
  workspace_id: string | null;
  workspaces: { id: string; name: string } | null;
}

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  jobTitle: z.string().max(100).optional(),
  timezone: z.string().max(50).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Try with user client first - only select columns that exist in schema
    let { data: profile, error: profileError } = await supabase
      .from("users")
      .select(`
        id,
        email,
        display_name,
        avatar_url,
        role,
        workspace_id,
        workspaces (
          id,
          name
        )
      `)
      .eq("id", user.id)
      .single();

    // If RLS blocks the query, try with admin client
    if (profileError && profileError.code !== "PGRST116") {
      const adminClient = createSupabaseAdminClient();
      const result = await adminClient
        .from("users")
        .select(`
          id,
          email,
          display_name,
          avatar_url,
          role,
          workspace_id,
          workspaces (
            id,
            name
          )
        `)
        .eq("id", user.id)
        .single();

      profile = result.data;
      profileError = result.error;
    }

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found", debug: { userId: user.id, error: profileError?.message } },
        { status: 404 }
      );
    }

    const typedProfile = profile as unknown as UserProfile;
    const workspace = typedProfile.workspaces;

    return NextResponse.json({
      id: typedProfile.id,
      email: typedProfile.email,
      displayName: typedProfile.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
      jobTitle: typedProfile.job_title || "",
      timezone: typedProfile.timezone || "UTC",
      avatarUrl: typedProfile.avatar_url || null,
      role: typedProfile.role || "pm",
      workspaceId: typedProfile.workspace_id,
      workspaceName: workspace?.name || "Workspace",
    });
  } catch (error) {
    console.error("User profile API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const result = updateProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { displayName, jobTitle, timezone, avatarUrl } = result.data;

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (displayName !== undefined) updateData.display_name = displayName;
    if (jobTitle !== undefined) updateData.job_title = jobTitle;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;

    // Use admin client to bypass RLS for self-update
    const adminClient = createSupabaseAdminClient();
    const { error: updateError } = await adminClient
      .from("users")
      .update(updateData as never)
      .eq("id", user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("User profile PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
