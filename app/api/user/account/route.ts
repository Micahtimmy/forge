import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";

const deleteAccountSchema = z.object({
  confirmEmail: z.string().email(),
});

export async function DELETE(req: Request) {
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
    const result = deleteAccountSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    const { confirmEmail } = result.data;

    // Verify email matches
    if (confirmEmail.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: "Email confirmation does not match your account" },
        { status: 400 }
      );
    }

    // Use admin client to delete the user
    const adminClient = createSupabaseAdminClient();

    // First, delete from users table (CASCADE will handle related records)
    const { error: deleteUserError } = await adminClient
      .from("users")
      .delete()
      .eq("id", user.id);

    if (deleteUserError) {
      console.error("Delete user record error:", deleteUserError);
      // Continue anyway - we still want to delete the auth user
    }

    // Delete the auth user
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(
      user.id
    );

    if (deleteAuthError) {
      console.error("Delete auth user error:", deleteAuthError);
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 }
      );
    }

    // Sign out the user
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion error:", error);
    Sentry.captureException(error, { tags: { api: "user-account" } });
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
