import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";

interface UserPreferences {
  user_id: string;
  email_notifications: boolean;
  weekly_digest: boolean;
  score_alerts: boolean;
}

const preferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  scoreAlerts: z.boolean().optional(),
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

    const adminClient = createSupabaseAdminClient();

    // Query using type assertion since table may not be in generated types
    const { data: prefs } = await adminClient
      .from("user_preferences" as "users")
      .select("*")
      .eq("user_id" as "id", user.id)
      .single() as { data: UserPreferences | null };

    // Return defaults if no preferences exist
    return NextResponse.json({
      emailNotifications: prefs?.email_notifications ?? true,
      weeklyDigest: prefs?.weekly_digest ?? true,
      scoreAlerts: prefs?.score_alerts ?? true,
    });
  } catch (error) {
    console.error("User preferences GET error:", error);
    Sentry.captureException(error, { tags: { api: "user-preferences" } });
    // Return defaults on error
    return NextResponse.json({
      emailNotifications: true,
      weeklyDigest: true,
      scoreAlerts: true,
    });
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
    const result = preferencesSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { emailNotifications, weeklyDigest, scoreAlerts } = result.data;

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    if (emailNotifications !== undefined) updateData.email_notifications = emailNotifications;
    if (weeklyDigest !== undefined) updateData.weekly_digest = weeklyDigest;
    if (scoreAlerts !== undefined) updateData.score_alerts = scoreAlerts;

    // Upsert preferences using type assertion
    const adminClient = createSupabaseAdminClient();
    const { error: upsertError } = await adminClient
      .from("user_preferences" as "users")
      .upsert(updateData as never, { onConflict: "user_id" });

    if (upsertError) {
      console.error("Preferences upsert error:", upsertError);
      return NextResponse.json(
        { error: "Failed to save preferences" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("User preferences PATCH error:", error);
    Sentry.captureException(error, { tags: { api: "user-preferences" } });
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
